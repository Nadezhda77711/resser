import { AffiliationsFolderClient } from '../page';

export default function AffiliationsFolderPage({ params }: { params: { folderId: string } }) {
  const folderId = Number(params.folderId);
  return <AffiliationsFolderClient folderId={folderId} />;
}
