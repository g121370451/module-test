export default class Result<T = unknown> {
  code: number
  message: string
  data: T

  constructor(code: number, message: string, data: T) {
    this.code = code
    this.message = message
    this.data = data
  }

  static success<T>(data: T): Result<T> {
    return new Result(0, 'successful', data)
  }

  static error(error?: string | [number, string]): Result<null> {
    if (typeof error === 'string') {
      return new Result(10000, error, null)
    }
    const [code, message] = error || [10000, 'Error']
    return new Result(code, message, null)
  }
}
type ERROR_TYPE = [number, string]
export const UPLOAD_Video_SIZE_ERROR: ERROR_TYPE = [10008, 'Video maximum 500M.']
export const UPLOAD_GIF_IMAGES_SIZE_ERROR: ERROR_TYPE = [10008, 'GIF image maximum 25M.']
export const UPLOAD_IMAGES_SIZE_ERROR: ERROR_TYPE = [10008, 'Image maximum 5M.']
