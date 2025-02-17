// src/app/api/analyze-slide/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
    try {
      const formData = await req.formData();
      const file = formData.get('file');
  
      if (!file || !(file instanceof Blob)) {
        return NextResponse.json({ error: 'Invalid file' }, { status: 400 });
      }
  
      const apiFormData = new FormData();
      apiFormData.append('file', file);
  
      // localhost ではなく analyze サービス名を使用
      const response = await fetch('http://analyze:8001/analyze-slide', {
        method: 'POST',
        headers: {
          'accept': 'application/json'
        },
        body: apiFormData
      });
  
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`FastAPI error: ${response.status} - ${errorText}`);
      }
  
      const result = await response.json();
      return NextResponse.json(result);
    } catch (error) {
      console.error('Error details:', error);
      return NextResponse.json(
        { error: `Error processing file: ${error.message}` },
        { status: 500 }
      );
    }
  }