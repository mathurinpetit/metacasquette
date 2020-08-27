<?php
namespace App\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\Controller;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;

class DefaultController extends Controller
{
    /**
     * @Route("/")
     */
    public function indexAction()
    {
      $telephone = $this->getParameter('app.telephone');
      $email = $this->getParameter('app.email');
      $facebook = $this->getParameter('app.facebook');
      $instagram = $this->getParameter('app.instagram');
      $ytid = $this->getParameter('app.ytid');
      // if($this->isMobile()){
      //   return $this->redirectToRoute('index_mobile');
      // }
      return $this->render('default/index.html.twig',array('email' => $email, 'facebook' => $facebook, 'instagram' => $instagram, 'telephone' => $telephone, 'ytid' => $ytid));
    }

    /**
     * @Route("/mobile")
     */
    public function indexMobileAction()
    {
      if(!$this->isMobile()){
        return $this->redirectToRoute('index');
      }

      return $this->render('default/metacasquette_mobile.html.twig');
    }

    /**
     * @Route("/path")
     */
    public function pathAction()
    {
      if($this->isMobile()){
        return $this->redirectToRoute('index_mobile');
      }

      return $this->render('default/metacasquette.html.twig');
    }

    public function isMobile(){
    $device = $this->get('mobile_detect.mobile_detector');

    return $device->isMobile() || $device->isTablet();
  }
}
