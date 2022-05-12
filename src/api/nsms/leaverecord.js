import request from '@/router/axios';

export const getList = (current, size, params) => {
  return request({
    url: '/api/nsms/leaverecord/list',
    method: 'get',
    params: {
      ...params,
      current,
      size,
    }
  })
}

export const getListForApproval = (current, size, params) => {
  return request({
    url: '/api/nsms/leaverecord/listForApproval',
    method: 'get',
    params: {
      ...params,
      current,
      size,
    }
  })
}

export const getDetail = (id) => {
  return request({
    url: '/api/nsms/leaverecord/detail',
    method: 'get',
    params: {
      id
    }
  })
}

export const remove = (objectList) => {
  return request({
    url: '/api/nsms/leaverecord/remove',
    method: 'post',
    data: objectList
  })
}

export const add = (row) => {
  return request({
    url: '/api/nsms/leaverecord/submit',
    method: 'post',
    data: row
  })
}

export const update = (row) => {
  return request({
    url: '/api/nsms/leaverecord/submit',
    method: 'post',
    data: row
  })
}

export const checkIn = (row) => {
  return request({
    url: '/api/nsms/leaverecord/checkIn',
    method: 'post',
    data: row
  })
}

export const recheckIn = (row) => {
  return request({
    url: '/api/nsms/leaverecord/recheckIn',
    method: 'post',
    data: row
  })
}
