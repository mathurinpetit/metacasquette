import importlib.util
import json
from pathlib import Path
import tempfile
import unittest

spec = importlib.util.spec_from_file_location('reel', Path(__file__).resolve().parents[2] / 'bin/instagram_reel.py')
reel = importlib.util.module_from_spec(spec)
spec.loader.exec_module(reel)


class FakeApi:
    def __init__(self, responses):
        self.responses = iter(responses)
        self.calls = []

    def call(self, path, params=None, method='GET'):
        self.calls.append((path, params or {}, method))
        result = next(self.responses)
        if isinstance(result, Exception):
            raise result
        return result


class PublicationTests(unittest.TestCase):
    def setUp(self):
        self.directory = tempfile.TemporaryDirectory()
        self.addCleanup(self.directory.cleanup)
        self.path = Path(self.directory.name) / 'state.json'
        self.state = dict(recordingId='test', status='prepared', caption='Test', videoUrl='https://example.com/video.mp4')

    def test_processing_never_publishes(self):
        api = FakeApi([{'id': 'container'}, {'status_code': 'IN_PROGRESS'}])
        reel.publish(api, 'account', self.state, self.path)
        self.assertEqual(api.calls[0][0::2], ('account/media', 'POST'))
        self.assertEqual(api.calls[0][1]['media_type'], 'REELS')
        self.assertEqual(api.calls[0][1]['share_to_feed'], 'false')
        self.assertEqual(api.calls[1][0::2], ('container', 'GET'))
        self.assertEqual(json.loads(self.path.read_text())['containerId'], 'container')

    def test_uncertain_publication_is_not_repeated(self):
        self.state.update(containerId='container', status='processing')
        api = FakeApi([{'status_code': 'FINISHED'}, RuntimeError('timeout')])
        with self.assertRaises(RuntimeError):
            reel.publish(api, 'account', self.state, self.path)
        persisted = json.loads(self.path.read_text())
        self.assertEqual(persisted['status'], 'publishing')
        retry = FakeApi([])
        with self.assertRaises(RuntimeError):
            reel.publish(retry, 'account', persisted, self.path)
        self.assertEqual(retry.calls, [])

    def test_published_reel_starts_story(self):
        self.state.update(mediaId='media', status='published')
        api = FakeApi([
            {'permalink': 'https://www.instagram.com/reel/test/'},
            {'id': 'story-container'},
            {'status_code': 'IN_PROGRESS'},
        ])
        reel.publish(api, 'account', self.state, self.path)
        self.assertEqual(api.calls[0][0::2], ('media', 'GET'))
        self.assertEqual(api.calls[1][0::2], ('account/media', 'POST'))
        self.assertEqual(api.calls[1][1]['media_type'], 'STORIES')
        self.assertEqual(api.calls[2][0::2], ('story-container', 'GET'))

    def test_reel_and_story_are_published_once(self):
        api = FakeApi([
            {'id': 'reel-container'},
            {'status_code': 'FINISHED'},
            {'id': 'reel-media'},
            {'permalink': 'https://www.instagram.com/reel/test/'},
            {'id': 'story-container'},
            {'status_code': 'FINISHED'},
            {'id': 'story-media'},
        ])
        result = reel.publish(api, 'account', self.state, self.path)
        self.assertEqual(result['status'], 'published')
        self.assertEqual(result['storyStatus'], 'published')
        self.assertEqual(result['mediaId'], 'reel-media')
        self.assertEqual(result['storyMediaId'], 'story-media')

        retry = FakeApi([{'permalink': 'https://www.instagram.com/reel/test/'}])
        reel.publish(retry, 'account', result, self.path)
        self.assertEqual(retry.calls, [('reel-media', {'fields': 'permalink'}, 'GET')])

    def test_account_mismatch_is_rejected(self):
        self.state['accountId'] = 'other'
        api = FakeApi([])
        with self.assertRaises(RuntimeError):
            reel.publish(api, 'account', self.state, self.path)
        self.assertEqual(api.calls, [])

    def test_recording_path_traversal_is_rejected(self):
        with self.assertRaises(RuntimeError):
            reel.prepare('../secrets')


if __name__ == '__main__':
    unittest.main()
