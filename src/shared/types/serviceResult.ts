export type ServiceResult<
  TSuccess extends object = Record<never, never>,
  TFailure extends object = Record<never, never>,
> =
  | ({
      success: true;
    } & TSuccess)
  | ({
      success: false;
      message: string;
    } & TFailure);
