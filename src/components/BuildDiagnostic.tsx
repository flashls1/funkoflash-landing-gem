import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AdminTalentAssetsWrapper } from '@/features/talent-assets/AdminTalentAssetsWrapper';
import { CharacterTagEditor } from '@/components/CharacterTagEditor';
import { ImagePreviewBox } from '@/components/ImagePreviewBox';
import { RichTextEditor } from '@/components/ui/rich-text-editor';

export const BuildDiagnostic: React.FC = () => {
  const timestamp = new Date().toISOString();
  
  return (
    <Card className="mb-4 border-2 border-green-500">
      <CardHeader>
        <CardTitle className="text-green-600">Build Diagnostic - V2.1 {timestamp}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 text-sm">
          <div>✅ AdminTalentAssetsWrapper: {AdminTalentAssetsWrapper ? 'Loaded' : 'Missing'}</div>
          <div>✅ CharacterTagEditor: {CharacterTagEditor ? 'Loaded' : 'Missing'}</div>
          <div>✅ ImagePreviewBox: {ImagePreviewBox ? 'Loaded' : 'Missing'}</div>
          <div>✅ RichTextEditor: {RichTextEditor ? 'Loaded' : 'Missing'}</div>
          <div>🏗️ Production build should include all new talent assets components</div>
        </div>
      </CardContent>
    </Card>
  );
};