import request from '@/router/axios';

export const getList = (current, size, params) => {
  return request({
    url: '/api/nsms/expectation/list',
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
    url: '/api/nsms/expectation/detail',
    method: 'get',
    params: {
      id
    }
  })
}

export const remove = (objectList) => {
  return request({
    url: '/api/nsms/expectation/remove',
    method: 'post',
    data: objectList
  })
}

export const add = (row) => {
  return request({
    url: '/api/nsms/expectation/submit',
    method: 'post',
    data: row
  })
}

export const update = (row) => {
  return request({
    url: '/api/nsms/expectation/submit',
    method: 'post',
    data: row
  })
}

export const getPriority = (referenceSid) => {
  return request({
    url: '/api/nsms/expectation/getPriority',
    method: 'get',
    params: {
      referenceSid
    }
  })
}
