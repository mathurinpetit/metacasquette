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
     * @Route("/admin/list")
     */
    public function adminListAction()
    {
      $telephone = $this->getParameter('app.telephone');
      $email = $this->getParameter('app.email');
      $facebook = $this->getParameter('app.facebook');
      $instagram = $this->getParameter('app.instagram');
      $ytid = $this->getParameter('app.ytid');
      $pathFiles = $this->getParameter('app.pathFiles');


      // instantiation, when using it inside the Symfony framework
      $serializer = $this->container->get('serializer');


      if(!file_exists($pathFiles.'/liste.csv')){
        return $this->redirect('/');
      }

      $metacasquettes = $serializer->decode(file_get_contents($pathFiles.'/liste.csv'), 'csv', [CsvEncoder::DELIMITER_KEY => ';']);
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
               'ytid' => $ytid, 'metacasquettes' => $metacasquettes));

    }


    /**
     * @Route("/admin/add")
     */
    public function adminAddAction(Request $request)
    {

      $pathFiles = $this->getParameter('app.pathFiles');
      $serializer = $this->container->get('serializer');
      $metacasquettes = $serializer->decode(file_get_contents($pathFiles.'/liste.csv'), 'csv', [CsvEncoder::DELIMITER_KEY => ';']);

      $lastmetacasquette = end($metacasquettes);

      $newId = intval(str_replace('#','',$lastmetacasquette["Numero"]))+1;

      $lastmetacasquette["Numero"] = "#".$newId;
      $lastmetacasquette["Description"] = "";
      $lastmetacasquette["Matieres"] = "";
      $lastmetacasquette["Taille"] = "";
      $lastmetacasquette["Code"] = "";
      $lastmetacasquette["Disponibilite"] = "";
      $lastmetacasquette["Proprietaire"] = "";
      $lastmetacasquette["NumeroLogo"] = substr(uniqid(), 0, 8);
      $lastmetacasquette["Cache"] = "";
      $lastmetacasquette["Etat"] = "";
      $lastmetacasquette["Instagram"] = "Non";

      $metacasquettes[] = $lastmetacasquette;

      file_put_contents($pathFiles.'/liste.csv',$serializer->encode($metacasquettes, 'csv', [CsvEncoder::DELIMITER_KEY => ';']));

      return $this->redirect($this->generateUrl('adminEdit', array('id' => $newId)));
    }


    /**
     * @Route("/admin/edit/{id}")
     */
    public function adminEditAction(Request $request,$id)
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
      if(!file_exists($pathFiles.'/liste.csv')){
        return $this->redirect('/');
      }



      $metacasquettes = $serializer->decode(file_get_contents($pathFiles.'/liste.csv'), 'csv', [CsvEncoder::DELIMITER_KEY => ';']);
      $form = null;
      foreach ($metacasquettes as $key => $row) {
        $id_casquette = sprintf("%04d", str_replace('#','',$row["Numero"]));
        if($id_casquette == $id){
          $metacasquette = $row;
          $NumeroLogoExists = $metacasquette['NumeroLogo'];
          $form = $this->createFormBuilder($metacasquette)
            ->add('Numero', TextType::class)
            ->add('Code', TextType::class)
            ->add('Annee', TextType::class)
            ->add('Description', TextareaType::class)
            ->add('Matieres', TextareaType::class)
            ->add('Taille', TextType::class)
            ->add('Disponibilite', TextType::class)
            ->add('Proprietaire', TextType::class)
            ->add('NumeroLogo', TextType::class,array('disabled' => $metacasquette['NumeroLogo']))
            ->add('Cache', TextType::class)
            ->add('Etat', TextType::class)
            ->add('Instagram', TextType::class)

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
          file_put_contents($pathFiles.'/liste.csv',$serializer->encode($metacasquettes, 'csv', [CsvEncoder::DELIMITER_KEY => ';']));
          return $this->redirect($this->generateUrl('adminList'));

      }

      return $this->render('admin/adminEdit.html.twig',array('email' => $email, 'facebook' => $facebook, 'instagram' => $instagram,
              'telephone' => $telephone, 'ytid' => $ytid, 'metacasquette' => $metacasquette, 'form' => $form->createView()));
    }

}
