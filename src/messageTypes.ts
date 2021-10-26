export type CompileRequest = {
  language: string;
  code: string;
};

export type CompileResult = {
  result: 'success' | 'compile_error' | 'invalid_request';
  session_id?: string;
  address?: string;
  message?: string;
};

export type CompileResultApiResponse = {
  result: 'success' | 'compile_error' | 'invalid_request';
  session_id?: string;
  message?: string;
};
