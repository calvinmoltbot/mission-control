import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import { getDb } from '@/lib/db';
import { readdir, readFile } from 'fs/promises';
import path from 'path';

const execAsync = promisify(exec);

interface SearchResult {
  type: 'memory' | 'activity' | 'document' | 'task';
  title: string;
  content: string;
  path?: string;
  date?: string;
  relevance: number;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q')?.toLowerCase() || '';
    
    if (!query || query.length < 2) {
      return NextResponse.json({ results: [] });
    }

    const results: SearchResult[] = [];

    // Search activities
    const db = getDb();
    const activities = db.prepare(
      `SELECT * FROM activities 
       WHERE LOWER(title) LIKE ? OR LOWER(description) LIKE ? 
       ORDER BY created_at DESC LIMIT 20`
    ).all(`%${query}%`, `%${query}%`) as any[];

    activities.forEach(a => {
      results.push({
        type: 'activity',
        title: a.title,
        content: a.description || '',
        date: a.created_at,
        relevance: calculateRelevance(query, a.title + ' ' + (a.description || ''))
      });
    });

    // Search memory files
    const memoryPath = path.join(process.cwd(), '..', '..', 'memory');
    const memoryResults = await searchMemoryFiles(memoryPath, query);
    results.push(...memoryResults);

    // Search main MEMORY.md
    const mainMemoryPath = path.join(process.cwd(), '..', '..', 'MEMORY.md');
    try {
      const content = await readFile(mainMemoryPath, 'utf-8');
      if (content.toLowerCase().includes(query)) {
        const lines = content.split('\n');
        const matchingLines = lines.filter(l => l.toLowerCase().includes(query));
        results.push({
          type: 'memory',
          title: 'MEMORY.md',
          content: matchingLines.slice(0, 3).join('\n'),
          path: 'MEMORY.md',
          relevance: calculateRelevance(query, content)
        });
      }
    } catch (e) {
      // Memory file might not exist
    }

    // Sort by relevance
    results.sort((a, b) => b.relevance - a.relevance);

    return NextResponse.json({ results: results.slice(0, 20) });
  } catch (error) {
    console.error('Error searching:', error);
    return NextResponse.json(
      { error: 'Failed to search' },
      { status: 500 }
    );
  }
}

async function searchMemoryFiles(memoryPath: string, query: string): Promise<SearchResult[]> {
  const results: SearchResult[] = [];
  
  try {
    const files = await readdir(memoryPath);
    
    for (const file of files) {
      if (file.endsWith('.md')) {
        const filePath = path.join(memoryPath, file);
        const content = await readFile(filePath, 'utf-8');
        
        if (content.toLowerCase().includes(query)) {
          const lines = content.split('\n');
          const matchingLines = lines.filter(l => l.toLowerCase().includes(query));
          
          results.push({
            type: 'memory',
            title: file.replace('.md', ''),
            content: matchingLines.slice(0, 3).join('\n') || content.slice(0, 200),
            path: `memory/${file}`,
            relevance: calculateRelevance(query, content)
          });
        }
      }
    }
  } catch (e) {
    // Directory might not exist
  }
  
  return results;
}

function calculateRelevance(query: string, text: string): number {
  const lowerText = text.toLowerCase();
  const lowerQuery = query.toLowerCase();
  
  let score = 0;
  
  // Exact match in title gets highest score
  if (lowerText.split('\n')[0]?.includes(lowerQuery)) {
    score += 10;
  }
  
  // Count occurrences
  const occurrences = (lowerText.match(new RegExp(lowerQuery, 'g')) || []).length;
  score += occurrences * 2;
  
  // Proximity to start of text
  const firstIndex = lowerText.indexOf(lowerQuery);
  if (firstIndex >= 0) {
    score += Math.max(0, 5 - firstIndex / 100);
  }
  
  return score;
}