import request from '@/router/axios';

export const getList = (current, size, params) => {
  return request({
    url: '/api/nsms/clockin/list',
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
    url: '/api/nsms/clockin/detail',
    method: 'get',
    params: {
      id
    }
  })
}

export const remove = (objectList) => {
  return request({
    url: '/api/nsms/clockin/remove',
    method: 'post',
    data: objectList
  })
}

export const add = (row) => {
  return request({
    url: '/api/nsms/clockin/submit',
    method: 'post',
    data: row
  })
}

export const update = (row) => {
  return request({
    url: '/api/nsms/clockin/submit',
    method: 'post',
    data: row
  })
}

