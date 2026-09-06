<?php
namespace App\Controller;

use App\Service\CatalogueCsvService;
use Symfony\Bundle\FrameworkBundle\Controller\Controller;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpFoundation\Request;

use Symfony\Component\Form\Extension\Core\Type\SubmitType;
use Symfony\Component\Form\Extension\Core\Type\TextType;
use Symfony\Component\Form\Extension\Core\Type\TextareaType;

class AdminController extends Controller
{
  private $catalogueCsvService;

  public function __construct(CatalogueCsvService $catalogueCsvService)
  {
    $this->catalogueCsvService = $catalogueCsvService;
  }

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


    public function adminListAction()
    {
      $telephone = $this->getParameter('app.telephone');
      $email = $this->getParameter('app.email');
      $facebook = $this->getParameter('app.facebook');
      $instagram = $this->getParameter('app.instagram');
      $ytid = $this->getParameter('app.ytid');
      if(!$this->catalogueCsvService->hasCatalog()){
        return $this->redirect('/');
      }

      $metacasquettes = $this->catalogueCsvService->getAdminCatalog();
      foreach ($metacasquettes as $key => $metacasquette) {
        $metacasquette["photos"] = $this->catalogueCsvService->hasAssets($metacasquette);
        $metacasquettes[$key] = $metacasquette;
      }

      return $this->render('admin/adminList.html.twig',
              array('email' => $email, 'facebook' => $facebook, 'instagram' => $instagram, 'telephone' => $telephone,
               'ytid' => $ytid, 'metacasquettes' => $metacasquettes));

    }


    public function adminAddAction(Request $request)
    {
      $newId = $this->catalogueCsvService->addDraftRecord();

      return $this->redirect($this->generateUrl('adminEdit', array('id' => $newId)));
    }


    public function adminEditAction(Request $request,$id)
    {
      $telephone = $this->getParameter('app.telephone');
      $email = $this->getParameter('app.email');
      $facebook = $this->getParameter('app.facebook');
      $instagram = $this->getParameter('app.instagram');
      $ytid = $this->getParameter('app.ytid');
      if(!$this->catalogueCsvService->hasCatalog()){
        return $this->redirect('/');
      }

      $metacasquette = $this->catalogueCsvService->findAdminRecordById((string) $id);
      if ($metacasquette === null) {
        throw $this->createNotFoundException();
      }

      $form = $this->createFormBuilder($metacasquette)
        ->add('Numero', TextType::class)
        ->add('Code', TextType::class)
        ->add('Annee', TextType::class)
        ->add('Description', TextareaType::class)
        ->add('Matieres', TextareaType::class)
        ->add('Taille', TextType::class)
        ->add('Disponibilite', TextType::class)
        ->add('Proprietaire', TextType::class)
        ->add('NumeroLogo', TextType::class,array('disabled' => !empty($metacasquette['NumeroLogo'])))
        ->add('Cache', TextType::class)
        ->add('Etat', TextType::class)
        ->add('Instagram', TextType::class)

        ->add('Enregistrer', SubmitType::class, ['label' => 'Enregistrer'])
        ->getForm();

      $form->handleRequest($request);
      if ($form->isSubmitted() && $form->isValid()) {
          $submittedMetacasquette = $form->getData();
          $submittedMetacasquette['Nombre de photos'] = $metacasquette['Nombre de photos'] ?? '';
          $this->catalogueCsvService->updateAdminRecord((string) $id, $submittedMetacasquette);
          return $this->redirect($this->generateUrl('adminImages', array('id' => $id)));
      }

      return $this->render('admin/adminEdit.html.twig',array('email' => $email, 'facebook' => $facebook, 'instagram' => $instagram,
              'telephone' => $telephone, 'ytid' => $ytid, 'metacasquette' => $metacasquette, 'form' => $form->createView()));
    }


        public function adminImagesAction(Request $request,$id)
        {
          $telephone = $this->getParameter('app.telephone');
          $email = $this->getParameter('app.email');
          $facebook = $this->getParameter('app.facebook');
          $instagram = $this->getParameter('app.instagram');
          $ytid = $this->getParameter('app.ytid');
          if(!$this->catalogueCsvService->hasCatalog()){
            return $this->redirect('/');
          }
          $metacasquette = $this->catalogueCsvService->findAdminRecordById((string) $id);
          if ($metacasquette === null) {
            throw $this->createNotFoundException();
          }

          return $this->render('admin/adminImages.html.twig',array('email' => $email, 'facebook' => $facebook, 'instagram' => $instagram,
                  'telephone' => $telephone, 'ytid' => $ytid, 'metacasquette' => $metacasquette,'id' => $id));
        }

      public function upload(Request $request): Response
      {
        if ($request->isMethod('POST')) {
            $typeImg = trim($request->request->get('typeImg'));
            $id = trim($request->request->get('id'));
            $file = $request->files->get('file');
            $name = $file->getClientOriginalName();

            $dir = __DIR__.'/../../public/img';
            $output=null;
            $retval=null;

            if($this->imagesExist($id)){
              $copyCmd = "mv ".$dir."/casquettes/".$id." ".$dir."/casquettes/".$id."_".date('YmdHms');
              exec($copyCmd,$output,$retval);
            }

            $nameOfImgFile = uniqid().'.jpg';
            $moveRes = $file->move($dir, $nameOfImgFile);

            $pathToScript = "../bin/images.py";
            $python="/usr/bin/python3";
            $commandPython = $python." ".$pathToScript.' "'.$id.'" "'.$typeImg.'" "../public/img/'.$nameOfImgFile.'"';

            exec($commandPython,$output,$retval);
            unlink($dir.'/'.$nameOfImgFile);
             return $this->json(['upload' => 'done']);

            }
            return $this->json(['upload' => 'nope']);

      }

      private function imagesExist($id)
      {
        $dir = __DIR__.'/../../public/img/casquettes/'.$id;
        if(!is_dir($dir)){
          return false;
        }
        if(!file_exists($dir.'/'.$id.'.png')){
          return false;
        }
        if(!file_exists($dir.'/'.$id.'.jpg')){
          return false;
        }
        if(!file_exists($dir.'/'.$id.'_side01.png')){
          return false;
        }
        if(!file_exists($dir.'/'.$id.'_side01.jpg')){
          return false;
        }
        if(!file_exists($dir.'/'.$id.'_side02.png')){
          return false;
        }
        if(!file_exists($dir.'/'.$id.'_side02.jpg')){
          return false;
        }
        if(!is_dir($dir.'/product')){
          return false;
        }
        if(!file_exists($dir.'/product/01.jpg')){
          return false;
        }
        return true;
      }

}
