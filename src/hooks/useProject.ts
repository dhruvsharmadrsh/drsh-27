import { useCallback, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Canvas as FabricCanvas } from 'fabric';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import type { CreativeFormat } from '@/store/creativeStore';

interface ProjectData {
  id: string;
  name: string;
  format_id: string;
  format_width: number;
  format_height: number;
  canvas_data: object;
  compliance_score: number;
  thumbnail_url: string | null;
}

export const useProject = (
  fabricCanvas: FabricCanvas | null,
  currentFormat: CreativeFormat,
  complianceScore: number
) => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [projectId, setProjectId] = useState<string | null>(searchParams.get('project'));
  const [projectName, setProjectName] = useState('Untitled Creative');
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Generate thumbnail from canvas
  const generateThumbnail = useCallback(async (): Promise<string | null> => {
    if (!fabricCanvas || !user) return null;

    try {
      const dataUrl = fabricCanvas.toDataURL({
        format: 'png',
        quality: 0.5,
        multiplier: 0.5,
      });

      // Convert data URL to blob
      const response = await fetch(dataUrl);
      const blob = await response.blob();

      // Upload to Supabase storage
      const fileName = `${user.id}/thumbnails/${Date.now()}.png`;
      const { error: uploadError } = await supabase.storage
        .from('assets')
        .upload(fileName, blob, { cacheControl: '3600', upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('assets')
        .getPublicUrl(fileName);

      return publicUrl;
    } catch (error) {
      console.error('Failed to generate thumbnail:', error);
      return null;
    }
  }, [fabricCanvas, user]);

  // Save project
  const saveProject = useCallback(async (): Promise<boolean> => {
    if (!fabricCanvas || !user) {
      toast.error('Please ensure you are logged in');
      return false;
    }

    setIsSaving(true);

    try {
      // Serialize canvas
      const canvasData = fabricCanvas.toJSON();
      
      // Generate thumbnail
      const thumbnailUrl = await generateThumbnail();

      const projectData = {
        name: projectName,
        user_id: user.id,
        format_id: currentFormat.id,
        format_width: currentFormat.width,
        format_height: currentFormat.height,
        canvas_data: canvasData,
        compliance_score: complianceScore,
        thumbnail_url: thumbnailUrl,
        updated_at: new Date().toISOString(),
      };

      let savedId = projectId;

      if (projectId) {
        // Update existing project
        const { error } = await supabase
          .from('projects')
          .update(projectData)
          .eq('id', projectId);

        if (error) throw error;
      } else {
        // Create new project
        const { data, error } = await supabase
          .from('projects')
          .insert(projectData)
          .select('id')
          .single();

        if (error) throw error;
        savedId = data.id;
        setProjectId(savedId);
        setSearchParams({ project: savedId });
      }

      toast.success('Project saved!');
      return true;
    } catch (error) {
      console.error('Failed to save project:', error);
      toast.error('Failed to save project');
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [fabricCanvas, user, projectId, projectName, currentFormat, complianceScore, generateThumbnail, setSearchParams]);

  // Load project
  const loadProject = useCallback(async (
    id: string,
    setCurrentFormat: (format: CreativeFormat) => void,
    availableFormats: CreativeFormat[]
  ): Promise<boolean> => {
    if (!fabricCanvas) return false;

    setIsLoading(true);

    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      const project = data as ProjectData;

      // Set project metadata
      setProjectId(project.id);
      setProjectName(project.name);

      // Find and set format
      const format = availableFormats.find(f => f.id === project.format_id);
      if (format) {
        setCurrentFormat(format);
      }

      // Load canvas data
      const canvasData = typeof project.canvas_data === 'string' 
        ? JSON.parse(project.canvas_data) 
        : project.canvas_data;

      return new Promise((resolve) => {
        fabricCanvas.loadFromJSON(canvasData, () => {
          fabricCanvas.renderAll();
          toast.success(`Loaded: ${project.name}`);
          resolve(true);
        });
      });
    } catch (error) {
      console.error('Failed to load project:', error);
      toast.error('Failed to load project');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [fabricCanvas]);

  return {
    projectId,
    projectName,
    setProjectName,
    isSaving,
    isLoading,
    saveProject,
    loadProject,
  };
};
