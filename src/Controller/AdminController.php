<?php
namespace App\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\Controller;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpFoundation\Request;
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
   * @Route("/admin")
   */
  public function adminAction()
  {
    $telephone = $this->getParameter('app.telephone');
    $email = $this->getParameter('app.email');
    $facebook = $this->getParameter('app.facebook');
    $instagram = $this->getParameter('app.instagram');
    $ytid = $this->getParameter('app.ytid');
    $pathFiles = $this->getParameter('app.pathFiles');

    return $this->render('admin/admin.html.twig',array('email' => $email, 'facebook' => $facebook, 'instagram' => $instagram,
            'telephone' => $telephone, 'ytid' => $ytid));
  }


    /**
     * @Route("/admin/list/{fileName}")
     */
    public function adminListAction($fileName)
    {
      $telephone = $this->getParameter('app.telephone');
      $email = $this->getParameter('app.email');
      $facebook = $this->getParameter('app.facebook');
      $instagram = $this->getParameter('app.instagram');
      $ytid = $this->getParameter('app.ytid');


      // instantiation, when using it inside the Symfony framework
      $serializer = $this->container->get('serializer');


      $pathFiles = $this->getParameter('app.pathFiles');
      if(!file_exists($pathFiles.'/'.$fileName.'.csv')){
        return $this->redirect('/');
      }

      $metacasquettes = $serializer->decode(file_get_contents($pathFiles.'/'.$fileName.'.csv'), 'csv', [CsvEncoder::DELIMITER_KEY => ';']);
      foreach ($metacasquettes as $key => $metacasquette) {
        $id_casquette = sprintf("%04d", $metacasquette["Numero"]);
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

      return $this->render('admin/adminList.html.twig',
              array('email' => $email, 'facebook' => $facebook, 'instagram' => $instagram, 'telephone' => $telephone,
               'ytid' => $ytid, 'metacasquettes' => $metacasquettes, 'fileName' => $fileName));

    }



    /**
     * @Route("/admin/edit/{fileName}/{id}")
     */
    public function adminEditAction(Request $request, $fileName,$id)
    {
      $telephone = $this->getParameter('app.telephone');
      $email = $this->getParameter('app.email');
      $facebook = $this->getParameter('app.facebook');
      $instagram = $this->getParameter('app.instagram');
      $ytid = $this->getParameter('app.ytid');
      $pathFiles = $this->getParameter('app.pathFiles');

      // instantiation, when using it inside the Symfony framework
      $serializer = $this->container->get('serializer');

      // encoding contents in CSV format

      $pathFiles = $this->getParameter('app.pathFiles');
      if(!file_exists($pathFiles.'/'.$fileName.'.csv')){
        return $this->redirect('/');
      }



      $metacasquettes = $serializer->decode(file_get_contents($pathFiles.'/'.$fileName.'.csv'), 'csv', [CsvEncoder::DELIMITER_KEY => ';']);
      $form = null;
      foreach ($metacasquettes as $key => $row) {
        $id_casquette = sprintf("%04d", str_replace('#','',$row["Numero"]));
        if($id_casquette == $id){
          $metacasquette = $row;
          $form = $this->createFormBuilder($metacasquette)
            ->add('Numero', TextType::class)
            ->add('Code', TextType::class)
            ->add('Description', TextareaType::class)
            ->add('Enregistrer', SubmitType::class, ['label' => 'Enregistrer'])
            ->getForm();
          break;
        }
      }

      $form->handleRequest($request);
      if ($form->isSubmitted() && $form->isValid()) {
          $metacasquette = $form->getData();
          foreach ($metacasquettes as $key => $row) {
            $id_casquette = sprintf("%04d", str_replace('#','',$row["Numero"]));
            if($id_casquette == $id){
              $metacasquettes[$key] = $metacasquette;
              break;
            }
          }
          //var_dump($serializer->encode($metacasquettes, 'csv', [CsvEncoder::DELIMITER_KEY => ';'])); exit;
          file_put_contents($pathFiles.'/'.$fileName.'.csv',$serializer->encode($metacasquettes, 'csv', [CsvEncoder::DELIMITER_KEY => ';']));
          return $this->redirect($this->generateUrl('adminList',array('fileName' => 'liste')));

      }

      return $this->render('admin/adminEdit.html.twig',array('email' => $email, 'facebook' => $facebook, 'instagram' => $instagram,
              'telephone' => $telephone, 'ytid' => $ytid, 'metacasquette' => $metacasquette, 'form' => $form->createView()));
    }

}
