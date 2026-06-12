import { useRef, useState } from "react";
import {
  Download,
  FileText,
  Loader2,
  Search,
  Sparkles,
  Trash2,
  Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/PageHeader";
import { documentService } from "@/services/documentService";
import {
  useAskDocuments,
  useDeleteDocument,
  useDocuments,
  useUploadDocument,
} from "@/hooks/useDocuments";
import type { DocumentCategory, DocumentItem } from "@/types";

const CATEGORY_LABEL: Record<DocumentCategory, string> = {
  BILL: "Bill",
  INSURANCE: "Insurance",
  CERTIFICATE: "Certificate",
  ID_DOCUMENT: "ID",
  RECEIPT: "Receipt",
  BANK_STATEMENT: "Bank",
  MEDICAL: "Medical",
  EDUCATION: "Education",
  TAX: "Tax",
  CONTRACT: "Contract",
  OTHER: "Other",
};

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function DocumentRow({ doc }: { doc: DocumentItem }) {
  const deleteDoc = useDeleteDocument();
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      await documentService.download(doc.id, doc.originalName);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="flex items-center gap-3 rounded-lg border bg-background p-4">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-secondary">
        <FileText className="h-5 w-5 text-primary" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">{doc.title}</p>
        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <span className="rounded-full bg-secondary px-2 py-0.5">{CATEGORY_LABEL[doc.category]}</span>
          <span>{formatSize(doc.sizeBytes)}</span>
          {doc.status === "READY" ? (
            <span>{doc.textChars.toLocaleString()} chars extracted</span>
          ) : (
            <span className="text-amber-600">{doc.status.toLowerCase()}</span>
          )}
          <span>{new Date(doc.createdAt).toLocaleDateString()}</span>
        </div>
      </div>
      <Button variant="ghost" size="icon" aria-label="Download" onClick={handleDownload} disabled={downloading}>
        {downloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
      </Button>
      <Button
        variant="ghost"
        size="icon"
        aria-label="Delete document"
        onClick={() => deleteDoc.mutate(doc.id)}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}

export function DocumentsPage() {
  const [search, setSearch] = useState("");
  const [question, setQuestion] = useState("");
  const fileInput = useRef<HTMLInputElement>(null);

  const documents = useDocuments(search);
  const uploadDoc = useUploadDocument();
  const ask = useAskDocuments();

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    Array.from(files).forEach((file) => uploadDoc.mutate({ file }));
    if (fileInput.current) fileInput.current.value = "";
  };

  const handleAsk = (e: React.FormEvent) => {
    e.preventDefault();
    if (question.trim()) ask.mutate(question.trim());
  };

  return (
    <div className="min-h-screen bg-muted/30">
      <PageHeader title="Documents" icon={<FileText className="h-5 w-5 text-primary" />}>
        <input
          ref={fileInput}
          type="file"
          className="hidden"
          multiple
          onChange={(e) => handleFiles(e.target.files)}
        />
        <Button onClick={() => fileInput.current?.click()} disabled={uploadDoc.isPending}>
          {uploadDoc.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Upload className="h-4 w-4" />
          )}
          Upload
        </Button>
      </PageHeader>

      <div className="container space-y-6 py-6">
        {/* Ask your documents */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Sparkles className="h-5 w-5 text-primary" /> Ask your documents
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAsk} className="flex gap-2">
              <Input
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="e.g. When does my insurance expire?"
              />
              <Button type="submit" disabled={ask.isPending || !question.trim()}>
                {ask.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Ask"}
              </Button>
            </form>
            {ask.data && (
              <div className="mt-4 rounded-lg border bg-muted/40 p-4">
                <p className="whitespace-pre-wrap text-sm">{ask.data.answer}</p>
                {ask.data.sources.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {ask.data.sources.map((s) => (
                      <span
                        key={s.id}
                        className="inline-flex items-center gap-1 rounded-full bg-background px-2 py-0.5 text-xs text-muted-foreground"
                      >
                        <FileText className="h-3 w-3" /> {s.title}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Search + list */}
        <div className="relative max-w-md">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search documents..."
            className="pl-8"
          />
        </div>

        {documents.isLoading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : documents.data?.length === 0 ? (
          <div className="rounded-xl border border-dashed p-10 text-center text-muted-foreground">
            <FileText className="mx-auto mb-3 h-10 w-10" />
            <p>{search ? "No documents match your search." : "No documents yet. Upload your first file."}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {documents.data?.map((doc) => (
              <DocumentRow key={doc.id} doc={doc} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
