#!/usr/bin/env python3
"""Prepare or explicitly publish one generated Reel, with resumable checkpoints."""
import argparse
import fcntl
import json
import os
from pathlib import Path
import re
import shutil
import subprocess
import sys
import time
import urllib.error
import urllib.parse
import urllib.request

ROOT = Path(__file__).resolve().parents[1]
STATE_DIR = ROOT / 'var/instagram'
PUBLIC_DIR = ROOT / 'public/instagram-reels'


def load_config():
    code = '''require "config/bootstrap.php";
    $keys = ["INSTAGRAM_ACCESS_TOKEN", "INSTAGRAM_USER_ID", "INSTAGRAM_PUBLISH_ENABLED"];
    $values = []; foreach ($keys as $key) { $values[$key] = $_ENV[$key] ?? getenv($key) ?: ""; }
    echo json_encode($values);'''
    result = subprocess.run(['php8.2', '-r', code], cwd=ROOT, capture_output=True, text=True)
    if result.returncode:
        raise RuntimeError('Impossible de charger la configuration privée Symfony.')
    return json.loads(result.stdout)


class Instagram:
    def __init__(self, token):
        if not token:
            raise RuntimeError('INSTAGRAM_ACCESS_TOKEN est vide.')
        self.token = token

    def call(self, path, params=None, method='GET'):
        encoded = urllib.parse.urlencode(params or {}).encode()
        url = 'https://graph.instagram.com/' + path
        if method == 'GET' and encoded:
            url += '?' + encoded.decode()
        request = urllib.request.Request(
            url, data=encoded if method == 'POST' else None,
            headers={'Authorization': 'Bearer ' + self.token}, method=method)
        try:
            with urllib.request.urlopen(request, timeout=40) as response:
                return json.load(response)
        except urllib.error.HTTPError as error:
            payload = json.load(error).get('error', {})
            message = str(payload.get('message', 'Erreur Meta')).replace(self.token, '[masqué]')
            raise RuntimeError(f"Meta HTTP {error.code}, code {payload.get('code')}: {message}") from None
        except (OSError, ValueError):
            raise RuntimeError('Réponse Meta indisponible ou invalide ; vérifier le statut avant de relancer.') from None


def write_state(path, state):
    temporary = path.with_suffix('.tmp')
    temporary.write_text(json.dumps(state, ensure_ascii=False, indent=2))
    temporary.replace(path)


def prepare(recording_id):
    if not re.fullmatch(r'[A-Za-z0-9_-]+', recording_id):
        raise RuntimeError('Identifiant de création invalide.')
    source = ROOT / 'jeudatas' / (recording_id + '_insta.mp4')
    if not source.is_file():
        raise RuntimeError('Le MP4 doit être généré avant la préparation.')
    metadata = json.loads((ROOT / 'jeudatas' / (recording_id + '_assets.json')).read_text())
    caption = metadata['texts']['videoVoiceover']
    PUBLIC_DIR.mkdir(exist_ok=True)
    target = PUBLIC_DIR / source.name
    if not target.exists():
        temporary = target.with_suffix('.tmp')
        shutil.copyfile(source, temporary)
        temporary.replace(target)
    return {'recordingId': recording_id, 'caption': caption,
            'videoUrl': 'https://metacasquette.com/instagram-reels/' + source.name,
            'status': 'prepared'}


def publish(api, user_id, state, path):
    if state.get('accountId') and state['accountId'] != user_id:
        raise RuntimeError('Cette préparation appartient à un autre compte Instagram.')
    state['accountId'] = user_id
    if state.get('mediaId'):
        # Retry only permalink retrieval after publication, never the publication itself.
        media = api.call(state['mediaId'], {'fields': 'permalink'})
        state.update(status='published', permalink=media['permalink'])
        write_state(path, state)

    if not state.get('mediaId'):
        if state['status'] in ('publishing', 'publication_unknown'):
            raise RuntimeError('Publication précédente incertaine : vérification manuelle requise pour éviter un doublon.')
        if not state.get('containerId'):
            container = api.call(user_id + '/media', {
                'media_type': 'REELS', 'video_url': state['videoUrl'],
                'caption': state['caption'], 'share_to_feed': 'false'}, 'POST')
            state.update(containerId=container['id'], status='processing')
            write_state(path, state)
        container = api.call(state['containerId'], {'fields': 'status_code,status'})
        status = container['status_code']
        if status == 'PUBLISHED':
            state['status'] = 'publication_unknown'
            write_state(path, state)
            raise RuntimeError('Meta indique que ce conteneur Reel est déjà publié ; ne pas republier.')
        if status in ('ERROR', 'EXPIRED'):
            state.update(status='failed', metaStatus=status)
            write_state(path, state)
            raise RuntimeError('Le traitement du Reel par Meta a échoué : ' + status)
        if status != 'FINISHED':
            return state
        # Persist before sending: an interrupted response must not cause a duplicate post.
        state['status'] = 'publishing'
        write_state(path, state)
        response = api.call(user_id + '/media_publish', {'creation_id': state['containerId']}, 'POST')
        state.update(mediaId=response['id'], status='published')
        write_state(path, state)
        media = api.call(state['mediaId'], {'fields': 'permalink'})
        state['permalink'] = media['permalink']
        write_state(path, state)
        (ROOT / 'jeudatas' / (state['recordingId'] + '_insta.mp4.txt')).write_text(state['permalink'])

    if state.get('storyMediaId'):
        state['storyStatus'] = 'published'
        write_state(path, state)
        return state
    if state.get('storyStatus') in ('publishing', 'publication_unknown'):
        raise RuntimeError('Publication précédente de la Story incertaine : vérification manuelle requise pour éviter un doublon.')
    if not state.get('storyContainerId'):
        story = api.call(user_id + '/media', {
            'media_type': 'STORIES', 'video_url': state['videoUrl']}, 'POST')
        state.update(storyContainerId=story['id'], storyStatus='processing')
        write_state(path, state)
    story_container = api.call(state['storyContainerId'], {'fields': 'status_code,status'})
    story_status = story_container['status_code']
    if story_status == 'PUBLISHED':
        state['storyStatus'] = 'publication_unknown'
        write_state(path, state)
        raise RuntimeError('Meta indique que ce conteneur Story est déjà publié ; ne pas republier.')
    if story_status in ('ERROR', 'EXPIRED'):
        state.update(storyStatus='failed', storyMetaStatus=story_status)
        write_state(path, state)
        raise RuntimeError('Le traitement de la Story par Meta a échoué : ' + story_status)
    if story_status != 'FINISHED':
        return state
    state['storyStatus'] = 'publishing'
    write_state(path, state)
    story_response = api.call(user_id + '/media_publish', {'creation_id': state['storyContainerId']}, 'POST')
    state.update(storyMediaId=story_response['id'], storyStatus='published')
    write_state(path, state)
    return state


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    action = parser.add_mutually_exclusive_group(required=True)
    parser.add_argument('--auto', action='store_true', help='Publish only when automatic publication is enabled')
    action.add_argument('--check', action='store_true', help='Read-only account and quota check')
    action.add_argument('--prepare', metavar='RECORDING_ID', help='Prepare a public MP4 without calling Meta')
    action.add_argument('--publish', metavar='RECORDING_ID', help='Explicitly publish the prepared Reel')
    args = parser.parse_args()
    config = load_config()
    if args.auto and config.get('INSTAGRAM_PUBLISH_ENABLED') != '1':
        print('Publication automatique désactivée.')
        return
    if args.check:
        api = Instagram(config['INSTAGRAM_ACCESS_TOKEN'])
        account = api.call('me', {'fields': 'user_id,username,account_type'})
        quota = api.call(account['user_id'] + '/content_publishing_limit', {'fields': 'quota_usage,config'})
        print(json.dumps({'account': account, 'quota': quota.get('data', [])}, ensure_ascii=False))
        return
    recording_id = args.prepare or args.publish
    if not re.fullmatch(r'[A-Za-z0-9_-]+', recording_id):
        raise RuntimeError('Identifiant invalide.')
    if args.auto:
        metadata = ROOT / 'jeudatas' / (recording_id + '_assets.json')
        for attempt in range(60):
            try:
                json.loads(metadata.read_text())['texts']['videoVoiceover']
                break
            except (OSError, ValueError, KeyError):
                time.sleep(2)
    STATE_DIR.mkdir(parents=True, exist_ok=True)
    path = STATE_DIR / (recording_id + '.json')
    with (STATE_DIR / (recording_id + '.lock')).open('a') as lock:
        fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
        state = json.loads(path.read_text()) if path.exists() else prepare(recording_id)
        write_state(path, state)
        if args.publish:
            api = Instagram(config['INSTAGRAM_ACCESS_TOKEN'])
            account = api.call('me', {'fields': 'user_id,username'})
            expected = config['INSTAGRAM_USER_ID']
            if not expected or expected != account['user_id']:
                raise RuntimeError('INSTAGRAM_USER_ID ne correspond pas au compte du token.')
            try:
                for attempt in range(120):
                    state = publish(api, expected, state, path)
                    if (state['status'] == 'published' and state.get('permalink')
                            and state.get('storyStatus') == 'published'):
                        break
                    print('Traitement vidéo Meta en cours…', flush=True)
                    time.sleep(5)
                else:
                    if state.get('status') == 'published':
                        state['storyStatus'] = 'timeout'
                    else:
                        state['status'] = 'timeout'
                    write_state(path, state)
            except (RuntimeError, OSError, ValueError, KeyError):
                if state.get('status') == 'published':
                    state['storyStatus'] = ('publication_unknown'
                                            if state.get('storyStatus') == 'publishing' else 'failed')
                else:
                    state['status'] = 'publication_unknown' if state.get('status') == 'publishing' else 'failed'
                write_state(path, state)
                raise
        print(json.dumps(state, ensure_ascii=False, indent=2))


if __name__ == '__main__':
    try:
        main()
    except (RuntimeError, OSError, ValueError, KeyError) as exc:
        print('Erreur : ' + str(exc), file=sys.stderr)
        sys.exit(1)
