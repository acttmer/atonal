import type {
  ErrorResponseModifier,
  InvalidRequestResponseModifier,
  NotFoundResponseModifier,
  SuccessResponseModifier,
} from './interface'

export const DEFAULT_SUCCESS_RESPONSE_MODIFIER: SuccessResponseModifier = (
  _req,
  res,
  data,
) => {
  res.statusCode = 200
  res.setHeader('Content-Type', 'application/json')
  res.end(
    JSON.stringify({
      code: 0,
      message: 'Success',
      data,
    }),
  )
}

export const DEFAULT_ERROR_RESPONSE_MODIFIER: ErrorResponseModifier = (
  _req,
  res,
  error,
) => {
  res.statusCode = 500
  res.setHeader('Content-Type', 'application/json')
  res.end(
    JSON.stringify({
      code: 500,
      message: 'Unknown server error',
      error: String(error),
    }),
  )
}

export const DEFAULT_INVALID_REQUEST_RESPONSE_MODIFIER: InvalidRequestResponseModifier =
  (_req, res, errors) => {
    res.statusCode = 400
    res.setHeader('Content-Type', 'application/json')
    res.end(
      JSON.stringify({
        code: 400,
        message: 'Invalid request',
        errors,
      }),
    )
  }

export const DEFAULT_NOT_FOUND_RESPONSE_MODIFIER: NotFoundResponseModifier = (
  _req,
  res,
) => {
  res.statusCode = 404
  res.setHeader('Content-Type', 'application/json')
  res.end(
    JSON.stringify({
      code: 404,
      message: 'Not found',
    }),
  )
}
