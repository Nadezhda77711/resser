import { EntitiesFileClient } from '../page';

export default function EntitiesFilePage({ params }: { params: { fileId: string } }) {
  const fileId = Number(params.fileId);
  return <EntitiesFileClient fileId={fileId} />;
}
