import request from '@/router/axios';

export const getList = (current, size, params) => {
  return request({
    url: '/api/nsms/clockinconfig/list',
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
    url: '/api/nsms/clockinconfig/detail',
    method: 'get',
    params: {
      id
    }
  })
}

export const remove = (objectList) => {
  return request({
    url: '/api/nsms/clockinconfig/remove',
    method: 'post',
    data: objectList
  })
}

export const add = (row) => {
  return request({
    url: '/api/nsms/clockinconfig/submit',
    method: 'post',
    data: row
  })
}

export const update = (row) => {
  return request({
    url: '/api/nsms/clockinconfig/submit',
    method: 'post',
    data: row
  })
}

export const getRQCodeRandomly = () => {
  return request({
    url: '/api/nsms/clockinconfig/getRQCodeRandomly',
    method: 'get',
  })
}

export const getRQCodeByMessage = (message) => {
  return request({
    url: '/api/nsms/clockinconfig/getRQCodeByMessage',
    method: 'get',
    params: {
      message,
    }
  })
}

export const submitVo = (row) => {
  return request({
    url: '/api/nsms/clockinconfig/submitVo',
    method: 'post',
    data: row
  })
}
