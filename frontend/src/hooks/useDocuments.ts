import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { documentService } from "@/services/documentService";
import { extractErrorMessage } from "@/services/api";

export function useDocuments(search: string) {
  return useQuery({
    queryKey: ["documents", search],
    queryFn: () => (search.trim() ? documentService.search(search.trim()) : documentService.list()),
  });
}

export function useUploadDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ file, title }: { file: File; title?: string }) =>
      documentService.upload(file, title),
    onSuccess: (doc) => {
      qc.invalidateQueries({ queryKey: ["documents"] });
      if (doc.status === "FAILED") {
        toast.warning(`Uploaded "${doc.title}", but text could not be extracted.`);
      } else {
        toast.success(`Uploaded "${doc.title}" (${doc.category.replace("_", " ").toLowerCase()})`);
      }
    },
    onError: (e) => toast.error(extractErrorMessage(e, "Upload failed")),
  });
}

export function useDeleteDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => documentService.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["documents"] }),
    onError: (e) => toast.error(extractErrorMessage(e, "Could not delete document")),
  });
}

export function useAskDocuments() {
  return useMutation({
    mutationFn: (question: string) => documentService.ask(question),
    onError: (e) => toast.error(extractErrorMessage(e, "Could not answer the question")),
  });
}
