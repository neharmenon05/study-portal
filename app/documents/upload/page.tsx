@@ .. @@
 // app/documents/upload/page.tsx - Document upload page
 'use client';

 import React, { useState, useCallback } from 'react';
 import { useRouter } from 'next/navigation';
 import { useDropzone } from 'react-dropzone';
 import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
 import { Button } from '@/components/ui/button';
 import { Input } from '@/components/ui/input';
 import { Textarea } from '@/components/ui/textarea';
 import { Label } from '@/components/ui/label';
+import { Badge } from '@/components/ui/badge';
 import { 
   CloudArrowUpIcon,
   DocumentIcon,
   PhotoIcon,
   VideoCameraIcon,
   SpeakerWaveIcon,
   XMarkIcon
 } from '@heroicons/react/24/outline';
 import { toast } from 'react-hot-toast';

 const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

+interface Subject {
+  id: string;
+  name: string;
+  code: string;
+  color: string;
+}

 const getFileIcon = (type: string) => {
   if (type.includes('image')) return PhotoIcon;
   if (type.includes('video')) return VideoCameraIcon;
   if (type.includes('audio')) return SpeakerWaveIcon;
   return DocumentIcon;
 };

 const formatFileSize = (bytes: number) => {
   if (bytes === 0) return '0 Bytes';
   const k = 1024;
   const sizes = ['Bytes', 'KB', 'MB', 'GB'];
   const i = Math.floor(Math.log(bytes) / Math.log(k));
   return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
 };

 export default function UploadPage() {
   const router = useRouter();
   const [isUploading, setIsUploading] = useState(false);
   const [selectedFile, setSelectedFile] = useState<File | null>(null);
+  const [subjects, setSubjects] = useState<Subject[]>([]);
   const [formData, setFormData] = useState({
     title: '',
     description: '',
-    category: '',
+    type: 'OTHER' as 'NOTES' | 'CODE' | 'VIDEO' | 'OTHER',
+    subjectId: '',
+    isShared: false,
+    allowPeerFeedback: true,
     tags: '',
   });

+  React.useEffect(() => {
+    fetchSubjects();
+  }, []);
+
+  const fetchSubjects = async () => {
+    try {
+      const response = await fetch('/api/subjects', {
+        credentials: 'include'
+      });
+
+      if (response.ok) {
+        const data = await response.json();
+        setSubjects(data.subjects);
+      }
+    } catch (error) {
+      console.error('Error fetching subjects:', error);
+    }
+  };

   const onDrop = useCallback((acceptedFiles: File[]) => {
     const file = acceptedFiles[0];
     if (!file) return;

     if (file.size > MAX_FILE_SIZE) {
       toast.error('File too large. Maximum size is 10MB');
       return;
     }

     setSelectedFile(file);
     setFormData(prev => ({
       ...prev,
       title: prev.title || file.name.replace(/\.[^/.]+$/, '')
     }));
   }, []);

   const { getRootProps, getInputProps, isDragActive } = useDropzone({
     onDrop,
     multiple: false,
     accept: {
       'application/pdf': ['.pdf'],
       'application/msword': ['.doc', '.docx'],
       'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
       'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp'],
       'video/*': ['.mp4', '.avi', '.mov', '.wmv'],
       'audio/*': ['.mp3', '.wav', '.ogg', '.m4a'],
       'text/*': ['.txt', '.md'],
     }
   });

   const handleUpload = async () => {
     if (!selectedFile) {
       toast.error('Please select a file');
       return;
     }

     if (!formData.title.trim()) {
       toast.error('Please enter a title');
       return;
     }

+    if (!formData.subjectId) {
+      toast.error('Please select a subject');
+      return;
+    }

     setIsUploading(true);

     try {
       const uploadFormData = new FormData();
       uploadFormData.append('file', selectedFile);
       uploadFormData.append('title', formData.title);
       uploadFormData.append('description', formData.description);
-      uploadFormData.append('category', formData.category);
+      uploadFormData.append('type', formData.type);
+      uploadFormData.append('subjectId', formData.subjectId);
+      uploadFormData.append('isShared', formData.isShared.toString());
+      uploadFormData.append('allowPeerFeedback', formData.allowPeerFeedback.toString());
       uploadFormData.append('tags', formData.tags);

-      const response = await fetch('/api/upload', {
+      const response = await fetch('/api/documents/upload', {
         method: 'POST',
         credentials: 'include',
         body: uploadFormData,
       });

       const data = await response.json();

       if (!response.ok) {
         throw new Error(data.error || 'Upload failed');
       }

       toast.success('File uploaded successfully!');
-      router.push('/materials');
+      router.push('/documents');

     } catch (error) {
       console.error('Upload error:', error);
       toast.error(error instanceof Error ? error.message : 'Upload failed');
     } finally {
       setIsUploading(false);
     }
   };

   const removeFile = () => {
     setSelectedFile(null);
   };

   const FileIcon = selectedFile ? getFileIcon(selectedFile.type) : DocumentIcon;

   return (
     <div className="max-w-2xl mx-auto p-6 space-y-6">
       {/* Header */}
       <div className="text-center">
-        <h1 className="text-3xl font-bold">Upload Study Material</h1>
+        <h1 className="text-3xl font-bold">Upload Academic Resource</h1>
         <p className="text-gray-600 mt-2">
-          Add files to your study library
+          Share your academic resources with the community
         </p>
       </div>

       {/* Upload Area */}
       <Card>
         <CardHeader>
           <CardTitle>Select File</CardTitle>
           <CardDescription>
             Upload PDFs, documents, images, videos, or audio files (max 10MB)
           </CardDescription>
         </CardHeader>
         <CardContent>
           {!selectedFile ? (
             <div
               {...getRootProps()}
               className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                 isDragActive 
                   ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                   : 'border-gray-300 hover:border-gray-400'
               }`}
             >
               <input {...getInputProps()} />
               <CloudArrowUpIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
               {isDragActive ? (
                 <p className="text-blue-600">Drop the file here...</p>
               ) : (
                 <div>
                   <p className="text-lg font-medium text-gray-900 dark:text-white mb-1">
                     Click to upload or drag and drop
                   </p>
                   <p className="text-gray-500">
                     PDF, DOC, images, videos, audio files
                   </p>
                 </div>
               )}
             </div>
           ) : (
             <div className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-800">
               <div className="flex items-center justify-between">
                 <div className="flex items-center space-x-3">
                   <FileIcon className="h-8 w-8 text-blue-500" />
                   <div>
                     <p className="font-medium">{selectedFile.name}</p>
                     <p className="text-sm text-gray-500">
                       {formatFileSize(selectedFile.size)}
                     </p>
                   </div>
                 </div>
                 <Button
                   variant="ghost"
                   size="sm"
                   onClick={removeFile}
                   className="text-red-500 hover:text-red-700"
                 >
                   <XMarkIcon className="h-4 w-4" />
                 </Button>
               </div>
             </div>
           )}
         </CardContent>
       </Card>

       {/* File Details Form */}
       {selectedFile && (
         <Card>
           <CardHeader>
             <CardTitle>Resource Details</CardTitle>
             <CardDescription>
               Add information about your academic resource
             </CardDescription>
           </CardHeader>
           <CardContent className="space-y-4">
             <div>
               <Label htmlFor="title">Title *</Label>
               <Input
                 id="title"
                 value={formData.title}
                 onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                 placeholder="Enter a title for this resource"
                 required
               />
             </div>

             <div>
               <Label htmlFor="description">Description</Label>
               <Textarea
                 id="description"
                 value={formData.description}
                 onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                 placeholder="Describe what this resource is about..."
                 rows={3}
               />
             </div>

+            <div>
+              <Label htmlFor="type">Resource Type *</Label>
+              <select
+                id="type"
+                value={formData.type}
+                onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as any }))}
+                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600"
+                required
+              >
+                <option value="NOTES">Notes</option>
+                <option value="CODE">Code</option>
+                <option value="VIDEO">Video</option>
+                <option value="OTHER">Other</option>
+              </select>
+            </div>

             <div>
-              <Label htmlFor="category">Category</Label>
-              <Input
-                id="category"
-                value={formData.category}
-                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
-                placeholder="e.g., Mathematics, Science, History"
-              />
+              <Label htmlFor="subjectId">Subject *</Label>
+              <select
+                id="subjectId"
+                value={formData.subjectId}
+                onChange={(e) => setFormData(prev => ({ ...prev, subjectId: e.target.value }))}
+                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600"
+                required
+              >
+                <option value="">Select a subject</option>
+                {subjects.map((subject) => (
+                  <option key={subject.id} value={subject.id}>
+                    {subject.code} - {subject.name}
+                  </option>
+                ))}
+              </select>
             </div>

             <div>
               <Label htmlFor="tags">Tags</Label>
               <Input
                 id="tags"
                 value={formData.tags}
                 onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value }))}
-                placeholder="Enter tags separated by commas (e.g., algebra, equations)"
+                placeholder="Enter tags separated by commas (e.g., algorithms, data-structures)"
               />
             </div>
+
+            <div className="space-y-3">
+              <div className="flex items-center space-x-2">
+                <input
+                  type="checkbox"
+                  id="isShared"
+                  checked={formData.isShared}
+                  onChange={(e) => setFormData(prev => ({ ...prev, isShared: e.target.checked }))}
+                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
+                />
+                <Label htmlFor="isShared" className="text-sm font-medium text-gray-700">
+                  Share with community
+                </Label>
+              </div>
+              
+              <div className="flex items-center space-x-2">
+                <input
+                  type="checkbox"
+                  id="allowPeerFeedback"
+                  checked={formData.allowPeerFeedback}
+                  onChange={(e) => setFormData(prev => ({ ...prev, allowPeerFeedback: e.target.checked }))}
+                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
+                />
+                <Label htmlFor="allowPeerFeedback" className="text-sm font-medium text-gray-700">
+                  Allow peer feedback
+                </Label>
+              </div>
+            </div>
           </CardContent>
         </Card>
       )}

       {/* Action Buttons */}
       <div className="flex gap-4">
         <Button
           variant="outline"
-          onClick={() => router.push('/materials')}
+          onClick={() => router.push('/documents')}
           className="flex-1"
         >
           Cancel
         </Button>
         <Button
           onClick={handleUpload}
           disabled={!selectedFile || isUploading}
           className="flex-1"
         >
-          {isUploading ? 'Uploading...' : 'Upload Material'}
+          {isUploading ? 'Uploading...' : 'Upload Resource'}
         </Button>
       </div>
     </div>
   );
 }