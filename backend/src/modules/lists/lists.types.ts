export interface CreateListInput {
  name: string;
  is_private?: boolean;
}

export interface UpdateListInput {
  is_private?: boolean;
}