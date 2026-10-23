import NewBookDialog from "./NewBookDialog";

interface EditBookDialogProps {
  bookId: number;
  onClose: () => void;
  onUpdated: () => void;
}

export default function EditBookDialog({
  bookId,
  onClose,
  onUpdated,
}: EditBookDialogProps) {
  return (
    <NewBookDialog
      editBookId={bookId}
      onClose={onClose}
      onSaved={onUpdated}
    />
  );
}
