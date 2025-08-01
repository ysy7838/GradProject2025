// constants.js

export const COMMON_MESSAGES = {
  INVALID_ID_FORMAT: "잘못된 ID 형식입니다.",
  INVALID_ARRAY_FORMAT: "배열 형식이어야 합니다.",
  ARRAY_EMPTY: "선택한 아이템이 없습니다.",
};

export const AUTH_MESSAGES = {
  // 성공 메시지
  EMAIL_SENT_SUCCESS: "인증번호 메일이 전송되었습니다.",
  CODE_VERIFIED: "인증번호가 확인되었습니다.",
  SIGNUP_SUCCESS: "회원가입이 완료되었습니다.",
  LOGIN_SUCCESS: "로그인이 완료되었습니다.",
  LOGOUT_SUCCESS: "로그아웃이 완료되었습니다.",
  PASSWORD_RESET_EMAIL_SENT_SUCCESS: "비밀번호 재설정을 위한 인증번호가 발송되었습니다.",
  PASSWORD_RESET_SUCCESS: "비밀번호가 성공적으로 변경되었습니다.",

  // invalid 에러
  INVALID_EMAIL_FORMAT: "이메일 형식이 올바르지 않습니다.",
  INVALID_CODE_FORMAT: "인증번호는 6자리 숫자입니다.",
  INVALID_PASSWORD_LENGTH: "비밀번호는 8~12글자 이내로 입력할 수 있습니다.",
  INVALID_PASSWORD_FORMAT: "비밀번호는 영문(대/소문자), 숫자, 특수문자 중 2종류 이상의 조합으로 이루어져야 합니다.",
  INVALID_REFRESH_TOKEN: "유효하지 않거나 만료된 Refresh Token입니다.",
  INVALID_CREDENTIALS: "이메일 또는 비밀번호가 올바르지 않습니다.",
  INVALID_TOKEN: "토큰이 올바르지 않아 권한이 거부되었습니다.",

  // 에러 메시지
  EMAIL_AND_CODE_REQUIRED: "이메일과 인증번호를 입력해주세요.",
  USER_NOT_FOUND: "사용자를 찾을 수 없습니다.",
  CODE_EXPIRED: "인증번호가 만료되었습니다.",
  CODE_MISMATCH: "인증번호가 일치하지 않습니다.",
  ALL_INFO_REQUIRED: "모든 정보를 입력해주세요.",
  EMAIL_ALREADY_REGISTERED: "이미 가입된 이메일입니다.",
  EMAIL_SEND_ERROR: "인증번호 메일 전송 중 오류가 발생했습니다.",
  CODE_VERIFICATION_ERROR: "인증번호 검증 중 오류가 발생했습니다.",
  SIGNUP_ERROR: "회원가입 중 오류가 발생했습니다.",
  EMAIL_AND_PASSWORD_REQUIRED: "이메일과 비밀번호를 모두 입력해주세요.",
  LOGIN_ERROR: "로그인 중 오류가 발생했습니다.",
  USER_INFO_NOT_FOUND: "사용자 정보를 찾을 수 없습니다.",
  LOGOUT_ERROR: "로그아웃 중 오류가 발생했습니다.",
  PASSWORD_CONFIRM_MISMATCH: "비밀번호와 비밀번호 확인이 일치하지 않습니다.",
  NEW_PASSWORD_CONFIRM_MISMATCH: "새 비밀번호와 확인 비밀번호가 일치하지 않습니다.",
};

// 복구 로직 (후작업)
export const USER_MESSAGES = {
  ACCOUNT_DEACTIVATED_TEMPORARILY: "탈퇴가 완료되었습니다. 7일 이내에 로그인할 경우, 계정이 복구됩니다.",
  ACCOUNT_RECOVERED_AND_LOGGED_IN: "탈퇴 신청된 계정이 복구되어 로그인되었습니다.",

  // 에러 메시지
  ACCOUNT_DELETED: "계정이 삭제되었습니다. 다시 가입해주세요.",
};

export const CATEGORY_MESSAGES = {
  // 성공 메시지
  CREATE_SUCCESS: "카테고리가 성공적으로 생성되었습니다.",
  GET_SUCCESS: "카테고리 목록을 성공적으로 조회했습니다.",
  UPDATE_SUCCESS: "카테고리가 성공적으로 업데이트되었습니다.",
  UPDATE_TITLE_SUCCESS: "카테고리 이름이 성공적으로 업데이트되었습니다.",
  UPDATE_COLOR_SUCCESS: "카테고리 색상이 성공적으로 업데이트되었습니다.",
  MOVE_SUCCESS: "카테고리가 성공적으로 이동되었습니다.",
  DELETE_SUCCESS: "카테고리가 성공적으로 삭제되었습니다.",
  NO_CHANGE: "변경 사항이 없습니다.",

  // 에러 메시지
  INVALID_TITLE_LENGTH: "제목은 50자 이하로 입력해주세요.",
  DUPLICATE_TITLE: "이미 동일한 이름의 카테고리가 있습니다.",
  CATEGORY_NOT_FOUND_OR_NO_PERMISSION: "카테고리를 찾을 수 없거나 접근 권한이 없습니다.",
  INVALID_CATEGORY_IDS: "업데이트/삭제할 카테고리 ID가 최소 하나 이상 필요합니다.",
  NO_UPDATE_FIELDS: "업데이트할 필드가 제공되지 않았습니다.",
  CANNOT_UPDATE_MULTIPLE_TITLES: "여러 카테고리의 이름을 동시에 변경할 수 없습니다.",
  CANNOT_MOVE_MULTIPLE_CATEGORIES: "여러 카테고리의 위치를 동시에 변경하는 기능은 지원되지 않습니다.",
  TARGET_CATEGORY_NOT_FOUND_OR_NO_PERMISSION: "새로운 대상 카테고리를 찾을 수 없거나 권한이 없습니다.",
  INVALID_DELETE_IDS_PROVIDED: "삭제할 카테고리 ID가 제공되지 않았습니다.",
  SERVER_ERROR: "서버 오류가 발생했습니다.",

  // 기타 일반 에러
  DUPLICATE_DATA_EXISTS: "중복된 데이터가 존재합니다.",
};

export const MEMO_MESSAGES = {
  // 성공 메시지
  CREATE_SUCCESS: "메모가 성공적으로 생성되었습니다.",
  GET_SUCCESS: "메모를 성공적으로 조회했습니다.",
  GET_LIST_SUCCESS: "메모 목록을 성공적으로 조회했습니다.",
  UPDATE_SUCCESS: "메모가 성공적으로 업데이트되었습니다.",
  FAVORITE_ADD_SUCCESS: "메모를 즐겨찾기에 추가했습니다.",
  FAVORITE_REMOVE_SUCCESS: "메모를 즐겨찾기에서 제거했습니다.",
  COPY_SUCCESS: "메모가 성공적으로 복사되었습니다.",
  MOVE_SUCCESS: "메모가 성공적으로 이동되었습니다.",
  DELETE_SUCCESS: "메모가 성공적으로 삭제되었습니다.",
  MAKE_HASHTAGS_SUCCESS: "해시태그가 성공적으로 생성되었습니다.",
  CONVERT_TO_VEC_SUCCESS: "메모가 벡터로 성공적으로 변환되었습니다.",
  SUMMARIZE_TEXT_SUCCESS: "텍스트 요약이 성공적으로 완료되었습니다.",
  SUMMARIZE_IMAGE_SUCCESS: "이미지 요약이 성공적으로 완료되었습니다.",

  // invalid 에러
  INVALID_TITLE_LENGTH: "제목은 100자 이하로 입력해주세요.",
  INVALID_CONTENT_TYPE: "내용 형식이 올바르지 않습니다.",
  INVALID_FAV_STATUS: "즐겨찾기 상태 값이 올바르지 않습니다.",
  INVALID_MEMO_ID: "유효하지 않은 메모 ID입니다.",
  INVALID_CATEGORY_ID: "유효하지 않은 카테고리 ID입니다.",

  // 에러 메시지
  MEMO_NOT_FOUND_OR_NO_PERMISSION: "메모를 찾을 수 없거나 접근 권한이 없습니다.",
  DUPLICATE_TITLE: "해당 카테고리에 동일한 제목의 메모가 이미 존재합니다.",
  FAVORITE_ALREADY_EXISTS: "이미 즐겨찾기에 추가된 메모입니다.",
  FAVORITE_NOT_FOUND: "즐겨찾기에서 해당 메모를 찾을 수 없습니다.",
  CANNOT_DELETE_NON_EXISTENT_FAVORITE: "존재하지 않는 즐겨찾기를 삭제할 수 없습니다.",
};
