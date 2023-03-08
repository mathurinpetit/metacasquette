<?php
namespace App\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\Controller;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;

use Symfony\Component\Serializer\Serializer;
use Symfony\Component\Serializer\Encoder\CsvEncoder;
use Symfony\Component\Serializer\Normalizer\ObjectNormalizer;

use Symfony\Component\Form\Extension\Core\Type\SubmitType;
use Symfony\Component\Form\Extension\Core\Type\TextType;
use Symfony\Component\Form\Extension\Core\Type\TextareaType;

class AdminController extends Controller
{
    /**
     * @Route("/admin/list")
     */
    public function adminListAction()
    {
      $telephone = $this->getParameter('app.telephone');
      $email = $this->getParameter('app.email');
      $facebook = $this->getParameter('app.facebook');
      $instagram = $this->getParameter('app.instagram');
      $ytid = $this->getParameter('app.ytid');


      // instantiation, when using it inside the Symfony framework
      $serializer = $this->container->get('serializer');

      // encoding contents in CSV format
      //$serializer->encode($data, 'csv');

      $pathFile = $this->getParameter('app.pathFile');

      $metacasquettes = $serializer->decode(file_get_contents($pathFile), 'csv', [CsvEncoder::DELIMITER_KEY => ';']);
      foreach ($metacasquettes as $key => $metacasquette) {
        $id_casquette = sprintf("%04d", $metacasquette["#numéro"]);
        $is_dir = is_dir("img/casquettes/".$id_casquette);
        if(!$is_dir){
          $metacasquette["photos"] = false;
          $metacasquettes[$key] = $metacasquette;
          continue;
        }
        $path = "img/casquettes/".$id_casquette;
        if(!file_exists($path.'/'.$id_casquette.'.jpg') ||
           !file_exists($path.'/'.$id_casquette.'.png') ||
           !file_exists($path.'/'.$id_casquette.'_side01.jpg') ||
           !file_exists($path.'/'.$id_casquette.'_side01.png') ||
           !file_exists($path.'/'.$id_casquette.'_side02.jpg') ||
           !file_exists($path.'/'.$id_casquette.'_side02.png')){
             $metacasquette["photos"] = false;
             $metacasquettes[$key] = $metacasquette;
             continue;
           }
           if(!is_dir($path."/product") || !file_exists($path."/product/01.jpg")){
                $metacasquette["photos"] = false;
                $metacasquettes[$key] = $metacasquette;
                continue;
          }
          $metacasquette["photos"] = true;
          $metacasquettes[$key] = $metacasquette;
      }

      return $this->render('admin/adminList.html.twig',array('email' => $email, 'facebook' => $facebook, 'instagram' => $instagram, 'telephone' => $telephone, 'ytid' => $ytid, 'metacasquettes' => $metacasquettes));

    }

    /**
     * @Route("/admin/edit/{id}")
     */
    public function adminEditAction($id)
    {
      $telephone = $this->getParameter('app.telephone');
      $email = $this->getParameter('app.email');
      $facebook = $this->getParameter('app.facebook');
      $instagram = $this->getParameter('app.instagram');
      $ytid = $this->getParameter('app.ytid');
      $pathFile = $this->getParameter('app.pathFile');

      // instantiation, when using it inside the Symfony framework
      $serializer = $this->container->get('serializer');

      // encoding contents in CSV format
      //$serializer->encode($data, 'csv');

      $metacasquettes = $serializer->decode(file_get_contents($pathFile), 'csv', [CsvEncoder::DELIMITER_KEY => ';']);
      $form = null;
      foreach ($metacasquettes as $key => $row) {
        $id_casquette = sprintf("%04d", $row["#numéro"]);
        if($id_casquette == $id){
          $metacasquette = $row;
          $form = $this->createFormBuilder($metacasquette)
            ->add('numero', TextType::class)
            ->add('Description', TextareaType::class)
            ->add('Code', TextType::class)
            ->add('Enregistrer', SubmitType::class, ['label' => 'Enregistrer'])
            ->getForm();
          break;
        }
      }

      return $this->render('admin/adminEdit.html.twig',array('email' => $email, 'facebook' => $facebook, 'instagram' => $instagram,
              'telephone' => $telephone, 'ytid' => $ytid, 'metacasquette' => $metacasquette, 'form' => $form->createView()));
    }

}
