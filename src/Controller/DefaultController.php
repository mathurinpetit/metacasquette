<?php
namespace App\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\Controller;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Annotation\Route;

class DefaultController extends Controller
{
    /**
     * @Route("/", name="/")
     */
    public function indexAction()
    {
      $telephone = $this->getParameter('app.telephone');
      $email = $this->getParameter('app.email');
      $facebook = $this->getParameter('app.facebook');
      $instagram = $this->getParameter('app.instagram');
      $ytid = $this->getParameter('app.ytid');

      $pathFiles = $this->getParameter('app.pathFiles');

      $casquettesFile = file($pathFiles.'/liste.csv');
      $casquettes = array();
      foreach ($casquettesFile as $line_num => $row) {
        if(substr($row,0,6) !== 'Numero' && substr($row,0,1) !== '#'){
            $casquettes[$line_num] = str_getcsv($row,';');
        }
      }
      $randCasquettes = array_rand($casquettes, 7);
      shuffle($randCasquettes);
      return $this->render('default/index.html.twig',array('email' => $email, 'facebook' => $facebook, 'instagram' => $instagram, 'telephone' => $telephone, 'ytid' => $ytid, 'mobile' => $this->isMobile(), 'casquettes' => $casquettes, 'randCasquettes' => $randCasquettes));
    }

    /**
     * @Route("/produit/{id}")
     */
    public function produitAction($id)
    {
      $telephone = $this->getParameter('app.telephone');
      $email = $this->getParameter('app.email');
      $facebook = $this->getParameter('app.facebook');
      $instagram = $this->getParameter('app.instagram');
      $ytid = $this->getParameter('app.ytid');
      $pathFiles = $this->getParameter('app.pathFiles');

      $casquettesFile = file($pathFiles.'/liste.csv');

      $casquette = null;
      foreach ($casquettesFile as $line_num => $row) {
        $c = str_getcsv($row,';');
        if(substr($row,0,6) !== 'Numero'  && substr($row,0,1) !== '#' && $c[0] == $id){
          $casquette = $c;
        }
      }

      return $this->render('default/produit.html.twig',array('email' => $email, 'facebook' => $facebook, 'instagram' => $instagram, 'telephone' => $telephone, 'ytid' => $ytid, 'casquette' => $casquette));
    }


    /**
     * @Route("/jeu/participations")
     */
    public function participationsJeuAction()
    {
      $telephone = $this->getParameter('app.telephone');
      $email = $this->getParameter('app.email');
      $facebook = $this->getParameter('app.facebook');
      $instagram = $this->getParameter('app.instagram');
      $ytid = $this->getParameter('app.ytid');
      $pathFiles = $this->getParameter('app.pathFiles');

      $startIpRegex = "/^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)_.+$/";

      $metaCasquettes = array();
      foreach (scandir('jeudatas') as $fileName) {
        if(strpos($fileName, "_layer.png") !== false){
          $startWithIp = preg_match($startIpRegex, $fileName);
          if(!$startWithIp){
            $strName = explode('_',$fileName);
            $id = $strName[0];
            $id_prefixed = 'jeudatas/'.$id;
            if(file_exists($id_prefixed.'.txt')){
              $id_auto_sort = date("YmdHis",filemtime($id_prefixed.'.txt')).'_'.$id;
              $metaCasquettes[$id_auto_sort] = array('layer' => $id_prefixed.'_layer.png', 'sound' => $id_prefixed.'_smallDescription.mp3','description' => file_get_contents($id_prefixed.'.txt'));
            }
          }
        }
      }
      return $this->render('default/jeuparticipations.html.twig',array('email' => $email, 'facebook' => $facebook, 'instagram' => $instagram, 'telephone' => $telephone, 'ytid' => $ytid, 'metacasquette' => $metaCasquettes));
    }

    /**
     * @Route("/jeuredirect")
     */
    public function jeuredirectAction()
    {
      $request = Request::createFromGlobals();
      $params = $request->query->all();
      if(count($params) > 0 && key_exists('id',$params)){
        return $this->redirect($this->generateUrl('jeu', array('id' => $params['id'])));
      }
      return $this->redirect($this->getParameter('app.gameurl'));
    }

    /**
     * @Route("/jeu/{id}")
     */
    public function jeuAction($id)
    {
      $telephone = $this->getParameter('app.telephone');
      $email = $this->getParameter('app.email');
      $facebook = $this->getParameter('app.facebook');
      $instagram = $this->getParameter('app.instagram');
      $ytid = $this->getParameter('app.ytid');

      $ip = isset($_SERVER['HTTP_CLIENT_IP'])
        ? $_SERVER['HTTP_CLIENT_IP']
        : (isset($_SERVER['HTTP_X_FORWARDED_FOR'])
          ? $_SERVER['HTTP_X_FORWARDED_FOR']
          : $_SERVER['REMOTE_ADDR']);

      $hasPlayMoreThan2 = $this->numberIp($ip);
      $next = strtotime("tomorrow 00:00:01")-time();
      return $this->render('jeu/jeu'.$id.'.html.twig',array('email' => $email, 'facebook' => $facebook, 'instagram' => $instagram, 'telephone' => $telephone, 'ytid' => $ytid, 'hasPlayMoreThan2' => $hasPlayMoreThan2,'next' => $next));
    }


    /**
      * @Route("/jeu/{id}/upload")
    */
    public function upload($id, Request $request): Response
    {
      if (!$request->isMethod('POST')) {
          return $this->redirect($this->generateUrl('jeu', array('id' => $id)));
      }
      $ip = isset($_SERVER['HTTP_CLIENT_IP'])
        ? $_SERVER['HTTP_CLIENT_IP']
        : (isset($_SERVER['HTTP_X_FORWARDED_FOR'])
          ? $_SERVER['HTTP_X_FORWARDED_FOR']
          : $_SERVER['REMOTE_ADDR']);

      if($this->numberIp($ip) > 2){
        return new JsonResponse(array('reason' => "maxGame", 'success' => false));
      }
      $identifiant = $ip;

      $file = $request->files->get('file');
      if(!preg_match('/audio/i',$file->getClientMimeType())){
        return $this->redirect($this->generateUrl('jeu', array('id' => $id)));
      }

      $langue = $request->request->get('langue');
      $dir = __DIR__.'/../../data/';
      $nameFile = uniqid($identifiant.'_', true);
      $completePath = $dir.$nameFile.'.wav';
      if(rename($file,$completePath) !== false){
        $openaikey = $this->getParameter('app.openaikey');
        $googleapifile = $this->getParameter('app.googleapifile');
        $cmd = "python3 ../bin/identify.py \"".$openaikey."\" \"".$googleapifile."\" \"".$nameFile."\" \"".$completePath."\" \"".$langue."\" 2>> /tmp/metaCasquette.err ";
        $result = shell_exec($cmd);

        return new JsonResponse(array('result' => json_decode($result), 'success' => true));
      }
      return $this->redirect($this->generateUrl('jeu', array('id' => $id)));
    }

    /**
      * @Route("/jeu/{id}/createmetacasquette")
    */
    public function createmetacasquette($id, Request $request): Response
    {
      if (!$request->isMethod('POST')) {
          return $this->redirect($this->generateUrl('jeu', array('id' => $id)));
      }

      $ip = isset($_SERVER['HTTP_CLIENT_IP'])
        ? $_SERVER['HTTP_CLIENT_IP']
        : (isset($_SERVER['HTTP_X_FORWARDED_FOR'])
          ? $_SERVER['HTTP_X_FORWARDED_FOR']
          : $_SERVER['REMOTE_ADDR']);

      if($this->numberIp($ip) > 2){
        return new JsonResponse(array('reason' => "maxGame", 'success' => false));
      }
      $identifiant = $ip;

      $openaikey = $this->getParameter('app.openaikey');
      $googleapifile = $this->getParameter('app.googleapifile');
      $idUser = $request->request->get('idUser');
      $name = $request->request->get('name');
      $whatilove = $request->request->get('whatilove');
      $cmd = "python3 ../bin/createMetacasquette.py \"".$openaikey."\" \"".$googleapifile."\" \"".$idUser."\" \"".$name."\"  \"".$whatilove."\" 2>> /tmp/metaCasquette.err ";
      $result = shell_exec($cmd);
      $json = json_decode($result);
      return new JsonResponse(array('result' => $json, 'success' => $json->success));

    }

    /**
      * @Route("/jeu/{id}/createVideoForInsta")
    */
    public function createVideoForInsta($id, Request $request): Response
    {
      if (!$request->isMethod('POST')) {
          return $this->redirect($this->generateUrl('jeu', array('id' => $id)));
      }

      $ip = isset($_SERVER['HTTP_CLIENT_IP'])
        ? $_SERVER['HTTP_CLIENT_IP']
        : (isset($_SERVER['HTTP_X_FORWARDED_FOR'])
          ? $_SERVER['HTTP_X_FORWARDED_FOR']
          : $_SERVER['REMOTE_ADDR']);

      if($this->numberIp($ip) > 2){
        return new JsonResponse(array('reason' => "maxGame", 'success' => false));
      }
      $identifiant = $ip;
      $idUser = $request->request->get('idUser');
      if(file_exists($pathFile = "jeudatas/".$idUser."_insta.mp4.txt")){
        return new JsonResponse(array('link' => file_get_contents($pathFile), 'success' => 1));
      }
      $cmd = "bash ../bin/createVideoForInsta.sh \"".$idUser."\" >> /tmp/metaCasquette.err ";
      $result = shell_exec($cmd);
      if(file_exists($pathFile = "jeudatas/".$idUser."_insta.mp4.txt")){
        return new JsonResponse(array('link' => file_get_contents($pathFile), 'success' => 1));
      }
      return new JsonResponse(array('reason' => "noPostInsta", 'success' => false));

    }

    /**
      * @Route("/jeu/{id}/randomgenerated")
    */
    public function randomgenerated($id, Request $request): Response
    {
      if (!$request->isMethod('POST')) {
          return $this->redirect($this->generateUrl('jeu', array('id' => $id)));
      }

      $ip = isset($_SERVER['HTTP_CLIENT_IP'])
        ? $_SERVER['HTTP_CLIENT_IP']
        : (isset($_SERVER['HTTP_X_FORWARDED_FOR'])
          ? $_SERVER['HTTP_X_FORWARDED_FOR']
          : $_SERVER['REMOTE_ADDR']);

      if($this->numberIp($ip) > 2){
        return new JsonResponse(array('reason' => "maxGame", 'success' => false));
      }
      $identifiant = $ip;

      $layers = array();
      foreach (scandir('jeudatas') as $fileName) {
        if(strpos($fileName, "_layer.png") !== false){
          $layers[] = $fileName;
        }
      }
      shuffle($layers);
      $imagePath = $layers[0];
      $strName = explode('_',$imagePath);

      $soundPath = $strName[0]."_smallDescription.mp3";
      $textPath = $strName[0].".txt";
      $text = "";
      if(!file_exists('jeudatas/'.$soundPath)){
        $soundPath = "";
      }
      if(file_exists('jeudatas/'.$textPath)){
        $text = file_get_contents('jeudatas/'.$textPath);
      }

      $result = array();
      $result['imagePath'] = $imagePath;
      $result['soundPath'] = $soundPath;
      $result['text'] = $text;
      return new JsonResponse(array('result' => $result, 'success' => true));

    }

    public function isMobile(){
    $device = $this->get('mobile_detect.mobile_detector');

    return $device->isMobile() || $device->isTablet();
  }

  private function numberIp($ip){

    $ctpLayerIp = 0;
    foreach (scandir('jeudatas') as $fileName) {
      if(preg_match("/^".$ip."_(.+)_layer.png$/", $fileName)){
        $ctpLayerIp++;
      }
    }

    return $ctpLayerIp;

  }
}
