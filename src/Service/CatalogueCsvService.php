<?php

namespace App\Service;

class CatalogueCsvService
{
    private const CSV_HEADERS = array(
        'Numero',
        'Annee',
        'Description',
        'Matieres',
        'Taille',
        'Code',
        'Disponibilite',
        'Proprietaire',
        'Nombre de photos',
        'NumeroLogo',
        'Cache',
        'Etat',
        'Instagram',
    );

    private $catalogDirectory;
    private $projectDir;

    public function __construct(string $catalogDirectory, string $projectDir)
    {
        $this->catalogDirectory = rtrim($catalogDirectory, '/');
        $this->projectDir = rtrim($projectDir, '/');
    }

    public function hasCatalog(): bool
    {
        return is_file($this->getCsvPath());
    }

    public function getFrontendCatalog(): array
    {
        $records = array();

        foreach ($this->getAdminCatalog() as $record) {
            if (!$this->hasAssets($record)) {
                continue;
            }

            $records[] = $this->toFrontendRecord($record);
        }

        return $records;
    }

    public function findFrontendRecordById(string $id): ?array
    {
        foreach ($this->getFrontendCatalog() as $record) {
            if ($this->formatModelNumber($record[0]) === $id) {
                return $record;
            }
        }

        return null;
    }

    public function getAdminCatalog(): array
    {
        if (!$this->hasCatalog()) {
            return array();
        }

        $handle = fopen($this->getCsvPath(), 'rb');
        if ($handle === false) {
            return array();
        }

        $headerRow = fgetcsv($handle, 0, ';');
        if ($headerRow === false) {
            fclose($handle);

            return array();
        }

        $headers = $this->normalizeHeaders($headerRow);
        $records = array();

        while (($row = fgetcsv($handle, 0, ';')) !== false) {
            if ($row === array(null)) {
                continue;
            }

            $record = array();
            foreach ($headers as $index => $header) {
                $record[$header] = isset($row[$index]) ? trim((string) $row[$index]) : '';
            }

            $records[] = $this->normalizeAdminRecord($record);
        }

        fclose($handle);

        return $records;
    }

    public function findAdminRecordById(string $id): ?array
    {
        foreach ($this->getAdminCatalog() as $record) {
            if ($this->formatModelNumber($record['Numero'] ?? null) === $id) {
                return $record;
            }
        }

        return null;
    }

    public function addDraftRecord(): string
    {
        $records = $this->getAdminCatalog();
        $nextId = 1;

        foreach ($records as $record) {
            $nextId = max($nextId, $this->extractModelNumber($record['Numero'] ?? null) + 1);
        }

        $record = $this->normalizeAdminRecord(array(
            'Numero' => '#'.$nextId,
            'Instagram' => 'Non',
        ));

        $records[] = $record;
        $this->writeAdminCatalog($records);

        return sprintf('%04d', $nextId);
    }

    public function updateAdminRecord(string $id, array $updatedRecord): void
    {
        $records = $this->getAdminCatalog();

        foreach ($records as $index => $existingRecord) {
            if ($this->formatModelNumber($existingRecord['Numero'] ?? null) !== $id) {
                continue;
            }

            $records[$index] = $this->normalizeAdminRecord(array_merge($existingRecord, $updatedRecord));
            $this->writeAdminCatalog($records);

            return;
        }

        throw new \RuntimeException(sprintf('Modele %s introuvable dans le catalogue.', $id));
    }

    public function hasAssets(array $record): bool
    {
        $modelNumber = $this->formatModelNumber($record['Numero'] ?? null);
        if ($modelNumber === null) {
            return false;
        }

        $baseDir = $this->projectDir.'/public/img/casquettes/'.$modelNumber;
        $requiredFiles = array(
            $baseDir.'/'.$modelNumber.'.jpg',
            $baseDir.'/'.$modelNumber.'.png',
            $baseDir.'/'.$modelNumber.'_side01.jpg',
            $baseDir.'/'.$modelNumber.'_side01.png',
            $baseDir.'/'.$modelNumber.'_side02.jpg',
            $baseDir.'/'.$modelNumber.'_side02.png',
            $baseDir.'/product/01.jpg',
        );

        foreach ($requiredFiles as $requiredFile) {
            if (!is_file($requiredFile)) {
                return false;
            }
        }

        return true;
    }

    public function getDatabaseRows(): array
    {
        $rows = array();

        foreach ($this->getAdminCatalog() as $record) {
            $rows[] = array(
                'numero_raw' => (string) ($record['Numero'] ?? ''),
                'numero_int' => $this->extractModelNumber($record['Numero'] ?? null),
                'annee' => (string) ($record['Annee'] ?? ''),
                'description' => (string) ($record['Description'] ?? ''),
                'matieres' => (string) ($record['Matieres'] ?? ''),
                'taille' => (string) ($record['Taille'] ?? ''),
                'code' => (string) ($record['Code'] ?? ''),
                'disponibilite' => (string) ($record['Disponibilite'] ?? ''),
                'proprietaire' => (string) ($record['Proprietaire'] ?? ''),
                'nombre_photos' => $this->normalizeNullableInteger($record['Nombre de photos'] ?? ''),
                'numero_logo' => (string) ($record['NumeroLogo'] ?? ''),
                'cache_value' => (string) ($record['Cache'] ?? ''),
                'etat' => (string) ($record['Etat'] ?? ''),
                'instagram' => (string) ($record['Instagram'] ?? ''),
            );
        }

        return $rows;
    }

    private function getCsvPath(): string
    {
        return $this->catalogDirectory.'/liste.csv';
    }

    private function normalizeHeaders(array $headers): array
    {
        $normalizedHeaders = array();

        foreach ($headers as $header) {
            $normalizedHeaders[] = preg_replace('/^\xEF\xBB\xBF/', '', trim((string) $header));
        }

        return $normalizedHeaders;
    }

    private function normalizeAdminRecord(array $record): array
    {
        $normalizedRecord = array();

        foreach (self::CSV_HEADERS as $header) {
            $normalizedRecord[$header] = isset($record[$header]) ? trim((string) $record[$header]) : '';
        }

        return $normalizedRecord;
    }

    private function writeAdminCatalog(array $records): void
    {
        $handle = fopen('php://temp', 'w+');
        if ($handle === false) {
            throw new \RuntimeException('Impossible de preparer l\'ecriture du catalogue.');
        }

        fputcsv($handle, self::CSV_HEADERS, ';');

        foreach ($records as $record) {
            $normalizedRecord = $this->normalizeAdminRecord($record);
            $row = array();

            foreach (self::CSV_HEADERS as $header) {
                $row[] = $normalizedRecord[$header];
            }

            fputcsv($handle, $row, ';');
        }

        rewind($handle);
        $content = stream_get_contents($handle);
        fclose($handle);

        if ($content === false) {
            throw new \RuntimeException('Impossible de lire le catalogue prepare en memoire.');
        }

        file_put_contents($this->getCsvPath(), $content);
    }

    private function toFrontendRecord(array $record): array
    {
        return array(
            0 => ltrim((string) ($record['Numero'] ?? ''), '#'),
            1 => (string) ($record['Annee'] ?? ''),
            2 => (string) ($record['Description'] ?? ''),
            3 => (string) ($record['Matieres'] ?? ''),
            4 => (string) ($record['Taille'] ?? ''),
            5 => (string) ($record['Code'] ?? ''),
            6 => (string) ($record['Disponibilite'] ?? ''),
            7 => (string) ($record['Proprietaire'] ?? ''),
            8 => (string) ($record['Nombre de photos'] ?? ''),
            9 => (string) ($record['NumeroLogo'] ?? ''),
            10 => (string) ($record['Cache'] ?? ''),
            11 => (string) ($record['Etat'] ?? ''),
            12 => (string) ($record['Instagram'] ?? ''),
        );
    }

    private function extractModelNumber(?string $numero): int
    {
        $normalized = ltrim(trim((string) $numero), '#');

        return $normalized === '' ? 0 : (int) $normalized;
    }

    private function formatModelNumber(?string $numero): ?string
    {
        $modelNumber = $this->extractModelNumber($numero);

        if ($modelNumber <= 0) {
            return null;
        }

        return sprintf('%04d', $modelNumber);
    }

    private function normalizeNullableInteger(string $value): ?int
    {
        $trimmedValue = trim($value);
        if ($trimmedValue === '') {
            return null;
        }

        return (int) $trimmedValue;
    }
}
