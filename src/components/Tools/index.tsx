import React from 'react';
import Base64Tool from './Base64Tool';
import UrlTool from './UrlTool';
import UuidTool from './UuidTool';
import JsonTool from './JsonTool';
import UlidTool from './UlidTool';

export type ToolDefinition = {
  id: string;
  title: string;
  description: string;
  Component: React.ComponentType;
};

/**
 * Registry of all tools displayed on the /tools page.
 * To add a new tool: create a component, then append one entry here.
 */
const toolRegistry: ToolDefinition[] = [
  {
    id: 'base64',
    title: 'Base64 Encode / Decode',
    description: 'Encode text to Base64 or decode Base64 back to text. Unicode-safe.',
    Component: Base64Tool,
  },
  {
    id: 'url',
    title: 'URL Encode / Decode',
    description: 'Encode or decode URL components using encodeURIComponent / decodeURIComponent.',
    Component: UrlTool,
  },
  {
    id: 'uuid',
    title: 'UUID v4 Generator',
    description: 'Generate one or more random UUID v4 strings.',
    Component: UuidTool,
  },
  {
    id: 'json',
    title: 'JSON Formatter',
    description: 'Pretty-print, minify, or validate JSON. Shows parse errors inline.',
    Component: JsonTool,
  },
  {
    id: 'ulid',
    title: 'ULID Generator',
    description: 'Generate one or more ULIDs — lexicographically sortable, timestamp-based unique identifiers.',
    Component: UlidTool,
  },
];

export default toolRegistry;
