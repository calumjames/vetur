import { TextDocument, Position, Range } from 'vscode-languageserver-types';
import { parseVueDocumentRegions, EmbeddedRegion } from './vueDocumentRegionParser';

export type LanguageId =
  | 'vue'
  | 'vue-html'
  | 'pug'
  | 'css'
  | 'postcss'
  | 'scss'
  | 'less'
  | 'stylus'
  | 'javascript'
  | 'typescript';

export interface LanguageRange extends Range {
  languageId: LanguageId;
  attributeValue?: boolean;
}

export interface VueDocumentRegions {
  getSingleLanguageDocument(languageId: LanguageId): TextDocument;
  getSingleTypeDocument(type: RegionType): TextDocument;

  getLanguageRangeByType(type: RegionType): LanguageRange | undefined;
  getLanguageRanges(range: Range): LanguageRange[];
  getLanguageAtPosition(position: Position): string;
  getLanguagesInDocument(): string[];
  getImportedScripts(): string[];
}

type RegionType = 'template' | 'script' | 'style' | 'custom';

const defaultType: { [type: string]: string } = {
  template: 'vue-html',
  script: 'javascript',
  style: 'css'
};

export function getVueDocumentRegions(document: TextDocument): VueDocumentRegions {
  const { regions, importedScripts } = parseVueDocumentRegions(document);

  return {
    getSingleLanguageDocument: (languageId: LanguageId) => getSingleLanguageDocument(document, regions, languageId),
    getSingleTypeDocument: (type: RegionType) => getSingleTypeDocument(document, regions, type),

    getLanguageRanges: (range: Range) => getLanguageRanges(document, regions, range),
    getLanguageRangeByType: (type: RegionType) => getLanguageRangeByType(document, regions, type),
    getLanguageAtPosition: (position: Position) => getLanguageAtPosition(document, regions, position),
    getLanguagesInDocument: () => getLanguagesInDocument(document, regions),
    getImportedScripts: () => importedScripts
  };
}

function getLanguageRanges(document: TextDocument, regions: EmbeddedRegion[], range: Range): LanguageRange[] {
  const result: LanguageRange[] = [];
  let currentPos = range ? range.start : Position.create(0, 0);
  let currentOffset = range ? document.offsetAt(range.start) : 0;
  const endOffset = range ? document.offsetAt(range.end) : document.getText().length;
  for (const region of regions) {
    if (region.end > currentOffset && region.start < endOffset) {
      const start = Math.max(region.start, currentOffset);
      const startPos = document.positionAt(start);
      if (currentOffset < region.start) {
        result.push({
          start: currentPos,
          end: startPos,
          languageId: 'vue'
        });
      }
      const end = Math.min(region.end, endOffset);
      const endPos = document.positionAt(end);
      if (end > region.start) {
        result.push({
          start: startPos,
          end: endPos,
          languageId: region.languageId
        });
      }
      currentOffset = end;
      currentPos = endPos;
    }
  }
  if (currentOffset < endOffset) {
    const endPos = range ? range.end : document.positionAt(endOffset);
    result.push({
      start: currentPos,
      end: endPos,
      languageId: 'vue'
    });
  }
  return result;
}

function getLanguagesInDocument(document: TextDocument, regions: EmbeddedRegion[]): string[] {
  const result = ['vue'];
  for (const region of regions) {
    if (region.languageId && result.indexOf(region.languageId) === -1) {
      result.push(region.languageId);
    }
  }
  return result;
}

function getLanguageAtPosition(document: TextDocument, regions: EmbeddedRegion[], position: Position): string {
  const offset = document.offsetAt(position);
  for (const region of regions) {
    if (region.start <= offset) {
      if (offset <= region.end) {
        return region.languageId;
      }
    } else {
      break;
    }
  }
  return 'vue';
}

/**
 * Get a document where all regions of `languageId` is preserved
 * Whereas other regions are replaced with whitespaces
 */
export function getSingleLanguageDocument(
  document: TextDocument,
  regions: EmbeddedRegion[],
  languageId: LanguageId
): TextDocument {
  const oldContent = document.getText();
  let newContent = oldContent.replace(/./g, ' ');

  for (const r of regions) {
    if (r.languageId === languageId) {
      newContent = newContent.slice(0, r.start) + oldContent.slice(r.start, r.end) + newContent.slice(r.end);
    }
  }

  return TextDocument.create(document.uri, languageId, document.version, newContent);
}

/**
 * Get a document where all regions of `type` RegionType is preserved
 * Whereas other regions are replaced with whitespaces
 */
export function getSingleTypeDocument(
  document: TextDocument,
  regions: EmbeddedRegion[],
  type: RegionType
): TextDocument {
  const oldContent = document.getText();
  let newContent = oldContent.replace(/./g, ' ');

  for (const r of regions) {
    if (r.type === type) {
      newContent = newContent.slice(0, r.start) + oldContent.slice(r.start, r.end) + newContent.slice(r.end);
    }
  }

  return TextDocument.create(document.uri, defaultType[type], document.version, newContent);
}

function getLanguageRangeByType(
  document: TextDocument,
  contents: EmbeddedRegion[],
  type: RegionType
): LanguageRange | undefined {
  for (const c of contents) {
    if (c.type === type) {
      return {
        start: document.positionAt(c.start),
        end: document.positionAt(c.end),
        languageId: c.languageId
      };
    }
  }
}
