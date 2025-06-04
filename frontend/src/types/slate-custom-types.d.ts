import { BaseEditor, BaseText } from 'slate';
import { ReactEditor } from 'slate-react';

type CustomText = BaseText & {
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strikethrough?: boolean;
};

type ParagraphElement = {
  type: 'paragraph';
  children: CustomText[];
};

type HeadingOneElement = {
  type: 'heading-one';
  children: CustomText[];
};

type HeadingTwoElement = {
  type: 'heading-two';
  children: CustomText[];
};

type HeadingThreeElement = {
  type: 'heading-three';
  children: CustomText[];
};

type ListItemElement = {
  type: 'list-item';
  children: CustomText[];
};

type BulletedListElement = {
  type: 'bulleted-list';
  children: ListItemElement[];
};

type NumberedListElement = {
  type: 'numbered-list';
  children: ListItemElement[];
};

export type CustomElement =
  | ParagraphElement
  | HeadingOneElement
  | HeadingTwoElement
  | HeadingThreeElement
  | BulletedListElement
  | NumberedListElement
  | ListItemElement;

declare module 'slate' {
  interface CustomTypes {
    Editor: BaseEditor & ReactEditor;
    Element: CustomElement;
    Text: CustomText;
  }
}
