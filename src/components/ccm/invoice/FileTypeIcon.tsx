
import React from 'react';
import { FileText, FileSpreadsheet, Mail, Image, FileType } from "lucide-react";

interface FileTypeIconProps {
  fileType: string;
}

const FileTypeIcon: React.FC<FileTypeIconProps> = ({ fileType }) => {
  switch(fileType) {
    case 'pdf':
      return <FileText className="h-5 w-5 text-red-500" />;
    case 'excel':
      return <FileSpreadsheet className="h-5 w-5 text-green-600" />;
    case 'email':
      return <Mail className="h-5 w-5 text-blue-500" />;
    case 'image':
      return <Image className="h-5 w-5 text-purple-500" />;
    default:
      return <FileType className="h-5 w-5" />;
  }
};

export default FileTypeIcon;
