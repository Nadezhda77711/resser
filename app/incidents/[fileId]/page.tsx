import { IncidentsFileClient } from '../page';

export default function IncidentsFilePage({ params }: { params: { fileId: string } }) {
  const fileId = Number(params.fileId);
  return <IncidentsFileClient fileId={fileId} />;
}
