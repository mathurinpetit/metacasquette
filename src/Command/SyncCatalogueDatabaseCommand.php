<?php

namespace App\Command;

use App\Service\CatalogueCsvService;
use PDO;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Input\InputOption;
use Symfony\Component\Console\Output\OutputInterface;

class SyncCatalogueDatabaseCommand extends Command
{
    protected static $defaultName = 'app:catalog:sync-db';

    private $catalogueCsvService;

    public function __construct(CatalogueCsvService $catalogueCsvService)
    {
        parent::__construct();

        $this->catalogueCsvService = $catalogueCsvService;
    }

    protected function configure()
    {
        $this
            ->setName('app:catalog:sync-db')
            ->setDescription('Cree ou met a jour la table SQL du catalogue a partir de liste.csv.')
            ->addOption('truncate', null, InputOption::VALUE_NONE, 'Vide la table avant de reimporter le catalogue.');
    }

    protected function execute(InputInterface $input, OutputInterface $output)
    {
        $databaseUrl = $this->getDatabaseUrl();
        if ($databaseUrl === '') {
            throw new \RuntimeException('DATABASE_URL est vide. Definis-la dans ton environnement ou dans .env.');
        }

        if (!$this->catalogueCsvService->hasCatalog()) {
            throw new \RuntimeException('liste.csv est introuvable, import impossible.');
        }

        $pdo = $this->createPdo($databaseUrl);
        $pdo->exec($this->getCreateTableSql());

        if ($input->getOption('truncate')) {
            $pdo->exec('TRUNCATE TABLE metacasquette_catalog');
        }

        $sql = <<<'SQL'
INSERT INTO metacasquette_catalog (
    numero_raw,
    numero_int,
    annee,
    description,
    matieres,
    taille,
    code,
    disponibilite,
    proprietaire,
    nombre_photos,
    numero_logo,
    cache_value,
    etat,
    instagram,
    created_at,
    updated_at
) VALUES (
    :numero_raw,
    :numero_int,
    :annee,
    :description,
    :matieres,
    :taille,
    :code,
    :disponibilite,
    :proprietaire,
    :nombre_photos,
    :numero_logo,
    :cache_value,
    :etat,
    :instagram,
    :created_at,
    :updated_at
)
ON DUPLICATE KEY UPDATE
    numero_int = VALUES(numero_int),
    annee = VALUES(annee),
    description = VALUES(description),
    matieres = VALUES(matieres),
    taille = VALUES(taille),
    code = VALUES(code),
    disponibilite = VALUES(disponibilite),
    proprietaire = VALUES(proprietaire),
    nombre_photos = VALUES(nombre_photos),
    numero_logo = VALUES(numero_logo),
    cache_value = VALUES(cache_value),
    etat = VALUES(etat),
    instagram = VALUES(instagram),
    updated_at = VALUES(updated_at)
SQL;

        $statement = $pdo->prepare($sql);
        $now = (new \DateTimeImmutable())->format('Y-m-d H:i:s');
        $importedRows = 0;

        $pdo->beginTransaction();

        try {
            foreach ($this->catalogueCsvService->getDatabaseRows() as $row) {
                $statement->execute(array(
                    'numero_raw' => $row['numero_raw'],
                    'numero_int' => $row['numero_int'],
                    'annee' => $this->normalizeNullableString($row['annee']),
                    'description' => $this->normalizeNullableString($row['description']),
                    'matieres' => $this->normalizeNullableString($row['matieres']),
                    'taille' => $this->normalizeNullableString($row['taille']),
                    'code' => $this->normalizeNullableString($row['code']),
                    'disponibilite' => $this->normalizeNullableString($row['disponibilite']),
                    'proprietaire' => $this->normalizeNullableString($row['proprietaire']),
                    'nombre_photos' => $row['nombre_photos'],
                    'numero_logo' => $this->normalizeNullableString($row['numero_logo']),
                    'cache_value' => $this->normalizeNullableString($row['cache_value']),
                    'etat' => $this->normalizeNullableString($row['etat']),
                    'instagram' => $this->normalizeNullableString($row['instagram']),
                    'created_at' => $now,
                    'updated_at' => $now,
                ));

                ++$importedRows;
            }

            $pdo->commit();
        } catch (\Throwable $exception) {
            if ($pdo->inTransaction()) {
                $pdo->rollBack();
            }

            throw $exception;
        }

        $output->writeln(sprintf('<info>%d enregistrements synchronises dans metacasquette_catalog.</info>', $importedRows));

        return 0;
    }

    private function getDatabaseUrl(): string
    {
        if (!empty($_SERVER['DATABASE_URL'])) {
            return (string) $_SERVER['DATABASE_URL'];
        }

        $databaseUrl = getenv('DATABASE_URL');

        return $databaseUrl === false ? '' : (string) $databaseUrl;
    }

    private function createPdo(string $databaseUrl): PDO
    {
        $parts = parse_url($databaseUrl);
        if ($parts === false || !isset($parts['scheme']) || $parts['scheme'] !== 'mysql') {
            throw new \RuntimeException('DATABASE_URL doit etre une URL MySQL valide.');
        }

        $databaseName = isset($parts['path']) ? ltrim($parts['path'], '/') : '';
        if ($databaseName === '') {
            throw new \RuntimeException('DATABASE_URL ne contient pas de nom de base.');
        }

        $dsn = sprintf(
            'mysql:host=%s;port=%d;dbname=%s;charset=utf8mb4',
            $parts['host'] ?? '127.0.0.1',
            $parts['port'] ?? 3306,
            $databaseName
        );

        return new PDO(
            $dsn,
            isset($parts['user']) ? urldecode($parts['user']) : '',
            isset($parts['pass']) ? urldecode($parts['pass']) : '',
            array(
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            )
        );
    }

    private function getCreateTableSql(): string
    {
        return <<<'SQL'
CREATE TABLE IF NOT EXISTS metacasquette_catalog (
    id INT AUTO_INCREMENT NOT NULL,
    numero_raw VARCHAR(32) NOT NULL,
    numero_int INT NOT NULL,
    annee VARCHAR(16) DEFAULT NULL,
    description LONGTEXT DEFAULT NULL,
    matieres LONGTEXT DEFAULT NULL,
    taille VARCHAR(255) DEFAULT NULL,
    code VARCHAR(255) DEFAULT NULL,
    disponibilite VARCHAR(255) DEFAULT NULL,
    proprietaire VARCHAR(255) DEFAULT NULL,
    nombre_photos INT DEFAULT NULL,
    numero_logo VARCHAR(64) DEFAULT NULL,
    cache_value VARCHAR(255) DEFAULT NULL,
    etat VARCHAR(255) DEFAULT NULL,
    instagram VARCHAR(32) DEFAULT NULL,
    created_at DATETIME NOT NULL,
    updated_at DATETIME NOT NULL,
    UNIQUE INDEX uniq_metacasquette_catalog_numero_raw (numero_raw),
    INDEX idx_metacasquette_catalog_numero_int (numero_int),
    INDEX idx_metacasquette_catalog_code (code),
    PRIMARY KEY(id)
) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB
SQL;
    }

    private function normalizeNullableString(?string $value): ?string
    {
        $trimmedValue = trim((string) $value);

        return $trimmedValue === '' ? null : $trimmedValue;
    }
}
