<?php
namespace App\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\Controller;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpFoundation\Request;
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
     * @Route("/expo/{id}")
     */
    public function expoAction($id)
    {
      $telephone = $this->getParameter('app.telephone');
      $email = $this->getParameter('app.email');
      $facebook = $this->getParameter('app.facebook');
      $instagram = $this->getParameter('app.instagram');
      $ytid = $this->getParameter('app.ytid');
      $pathFiles = $this->getParameter('app.pathFiles');

      $casquettesFile = file($pathFiles.'/liste.csv');

      $expoDescFile = file($pathFiles.'/expo.csv');
      $description = "";
      foreach ($expoDescFile as $line_num => $row) {
        $d = str_getcsv($row,';');
        if(substr($row,0,6) !== 'Numero'  && substr($row,0,1) !== '#' && $d[0] == $id){
        $description = $d[1];
        }
      }

      $casquettes = array();
      foreach ($casquettesFile as $line_num => $row) {
        $c = str_getcsv($row,';');
        if(substr($row,0,6) !== 'Numero'  && substr($row,0,1) !== '#' && $c[11] == $id){
        $casquettes[] = $c;
        }
      }
      return $this->render('default/expo.html.twig',array('email' => $email, 'facebook' => $facebook, 'instagram' => $instagram, 'telephone' => $telephone, 'ytid' => $ytid, 'casquettes' => $casquettes, 'description' => $description));
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

      return $this->render('jeu/jeu'.$id.'.html.twig',array('email' => $email, 'facebook' => $facebook, 'instagram' => $instagram, 'telephone' => $telephone, 'ytid' => $ytid));
    }


    public function isMobile(){
    $device = $this->get('mobile_detect.mobile_detector');

    return $device->isMobile() || $device->isTablet();
  }
}
