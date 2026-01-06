"use client"
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, Download, Trash2, File, HardDrive, Search, Filter, Loader2, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';

const UploadsPage = () => {
  const [uploads, setUploads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const load = async () => {
    setLoading(true);
    const res = await fetch('/api/uploads');
    if (res.ok) {
      const data = await res.json();
      setUploads(data.uploads || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const handleDelete = async (id: number) => {
    const res = await fetch(`/api/uploads/${id}`, { method: 'DELETE' });
    if (res.ok) load();
  };

  const filteredUploads = uploads.filter(u =>
    u.fileName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto p-6 md:p-10 space-y-10 animate-in fade-in duration-700">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2 border-b">
        <div className="space-y-2">
          <Badge variant="outline" className="px-3 border-primary/20 text-primary bg-primary/5 font-bold uppercase tracking-widest text-[10px]">Library</Badge>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tighter">Your Documents</h1>
          <p className="text-muted-foreground font-medium">Manage and access all your uploaded learning materials.</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search files..."
              className="pl-10 h-11 w-full md:w-64 rounded-xl transition-all border-border focus:border-primary/50 bg-background/50"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button variant="outline" size="icon" className="h-11 w-11 rounded-xl shrink-0">
            <Filter className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-32 space-y-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary/40" />
          <p className="text-sm font-bold text-muted-foreground animate-pulse">Scanning storage...</p>
        </div>
      ) : filteredUploads.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-32 border-2 border-dashed rounded-3xl bg-accent/5">
          <div className="h-20 w-20 bg-background rounded-full flex items-center justify-center shadow-xl mb-6">
            <HardDrive className="h-10 w-10 text-muted-foreground/30" />
          </div>
          <h2 className="text-xl font-bold">No documents found</h2>
          <p className="text-muted-foreground mt-2 max-w-xs text-center">
            {searchQuery ? "Try a different search term or clear the filter." : "Start by uploading a document in the chat interface."}
          </p>
          {searchQuery && (
            <Button variant="link" onClick={() => setSearchQuery('')} className="mt-4">Clear Search</Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredUploads.map((u) => (
            <Card key={u.id} className="group overflow-hidden rounded-3xl border-border/50 bg-background/50 backdrop-blur-sm transition-all duration-300 hover:border-primary/30 hover:shadow-2xl hover:shadow-primary/5 hover:-translate-y-1">
              <CardHeader className="p-0">
                <div className="h-32 bg-linear-to-br from-primary/5 via-primary/10 to-transparent flex items-center justify-center relative overflow-hidden">
                  <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Badge variant="secondary" className="bg-background/80 backdrop-blur-md border-none font-bold text-[10px]">
                      {u.fileName.split('.').pop()?.toUpperCase()}
                    </Badge>
                  </div>
                  <FileText className="h-12 w-12 text-primary/40 group-hover:scale-110 group-hover:text-primary/60 transition-all duration-500" />
                </div>
              </CardHeader>
              <CardContent className="p-5 space-y-1">
                <CardTitle className="text-base font-bold truncate group-hover:text-primary transition-colors leading-tight" title={u.fileName}>
                  {u.fileName}
                </CardTitle>
                <div className="flex items-center gap-3 text-xs font-bold text-muted-foreground/60 uppercase tracking-tighter">
                  <span className="flex items-center gap-1">
                    <HardDrive className="h-3 w-3" />
                    {(u.fileSize / 1024).toFixed(1)} KB
                  </span>
                  <span className="flex items-center gap-1 border-l pl-3">
                    <Clock className="h-3 w-3" />
                    {new Date(u.createdAt || Date.now()).toLocaleDateString()}
                  </span>
                </div>
              </CardContent>
              <CardFooter className="p-5 pt-0 flex gap-2">
                <Button
                  asChild
                  variant="secondary"
                  className="flex-1 rounded-xl h-10 font-bold text-xs gap-2 transition-all hover:bg-primary hover:text-primary-foreground border-none"
                >
                  <a href={u.fileUrl} target="_blank" rel="noreferrer">
                    <Download className="h-3.5 w-3.5" />
                    Download
                  </a>
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDelete(u.id)}
                  className="rounded-xl h-10 w-10 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors shrink-0"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default UploadsPage;