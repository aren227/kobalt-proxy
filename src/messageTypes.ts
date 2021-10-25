export type CompileRequest = {
  language: string;
  code: string;
};

export type CompileResult = {
  result: 'success' | 'compile_error' | 'language_not_found';
  sessionId?: string;
};
