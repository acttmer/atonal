import { NextResponse } from 'next/server'
import type {
  ErrorResponseModifier,
  InvalidRequestResponseModifier,
  SuccessResponseModifier,
} from './interface'

export const DEFAULT_SUCCESS_RESPONSE_MODIFIER: SuccessResponseModifier =
  data => {
    return NextResponse.json(
      {
        code: 0,
        message: 'Success',
        data,
      },
      { status: 200 },
    )
  }

export const DEFAULT_ERROR_RESPONSE_MODIFIER: ErrorResponseModifier = error => {
  return NextResponse.json(
    {
      code: 500,
      message: 'Unknown server error',
      error: String(error),
    },
    { status: 500 },
  )
}

export const DEFAULT_INVALID_REQUEST_RESPONSE_MODIFIER: InvalidRequestResponseModifier =
  errors => {
    return NextResponse.json(
      {
        code: 400,
        message: 'Invalid request',
        errors,
      },
      { status: 400 },
    )
  }
