// Simple file upload utility for handling multipart form data
export interface ParsedFile {
  filename: string;
  data: ArrayBuffer;
  size: number;
  type: string;
}

export async function parseMultipartFormData(request: Request): Promise<{
  files: ParsedFile[];
  fields: Record<string, string>;
}> {
  const formData = await request.formData();
  const files: ParsedFile[] = [];
  const fields: Record<string, string> = {};

  for (const [key, value] of formData.entries()) {
    if (value instanceof File) {
      const arrayBuffer = await value.arrayBuffer();
      files.push({
        filename: value.name,
        data: arrayBuffer,
        size: value.size,
        type: value.type,
      });
    } else {
      fields[key] = value.toString();
    }
  }

  return { files, fields };
}
