import { useState, useEffect, useCallback, useRef, useContext } from "react";
import axios, { AxiosRequestConfig, AxiosResponse, Canceler } from 'axios';

import { RouterContext } from '../Contexts/RouteProvider';
import { UserContext } from "../Contexts/UserProvider";
import ConfigContext from "../Contexts/ConfigContext";

export enum FetchType {
  GET = 'get',
  POST = 'post',
  PUT = 'put'
}

function constructRequest(uri: string, type: FetchType, options: AxiosRequestConfig, body?: any): Promise<AxiosResponse<any>> {
  switch (type) {
    case FetchType.GET:
      return axios.get(uri, options)
    case FetchType.POST:
      return axios.post(uri, body, options)
    case FetchType.PUT:
      return axios.put(uri, body, options)
    default:
      throw new Error('');
  }
}

const defaultOption = Object.freeze({});

/**
 *
 *
 * @param {string} uri
 * @param {FetchType} [type=FetchType.GET]
 * @param {AxiosRequestConfig} [options]
 * @returns {([T, boolean, string | null, (body: any, noRedirect?: boolean, token?: string) => void, () => void])}
 */
function useFetchData<T>(
  uri: string,
  type: FetchType = FetchType.GET,
  options: AxiosRequestConfig = defaultOption,
  interval?: number
): [T | null, boolean, string | null, (body?: any, noRedirect?: boolean, token?: string) => Promise<any>, () => void] {

  const { baseUrl } = useContext(ConfigContext);
  const { token } = useContext(UserContext);
  const { history } = useContext(RouterContext);
  const historyRef = useRef(history);

  const [data, setData] = useState<T | null>(null);
  const [isLoading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const cancelToken = useRef<Canceler | null>(null);

  const next = useCallback(_next, [baseUrl, uri, type, options, token]);

  useEffect(() => {
    historyRef.current = history;
  }, [history]);

  useEffect(() => {
    if (token) {
      axios.defaults.headers['Authorization'] = `Bearer ${token}`;
    }
  }, [token]);

  useEffect(() => {
    if (type === FetchType.GET) {
      next({}).catch(() => { });
    }
  }, [token, type, next, interval])

  function cancel() {
    if (cancelToken.current) {
      cancelToken.current();
    }
  }

  function _next(body?: any, noRedirect?: boolean, token?: string) {
    if (cancelToken.current) {
      cancel();
    }

    setLoading(true);
    const _options = Object.assign({}, options, { cancelToken: new axios.CancelToken(token => cancelToken.current = token) });
    if (token && token.length) {
      axios.defaults.headers['Authorization'] = `Bearer ${token}`;
    }

    return constructRequest(`${baseUrl}${uri}`, type, _options, body)
      .then(res => {
        setLoading(false);
        setErrorMessage(null);
        setData(res.data);
        return res;
      })
      .catch(err => {
        setLoading(false);
        if (!noRedirect && (err.code === 401 || err.response?.status === 401)) {
          historyRef.current.push('/login');
          return;
        }

        setErrorMessage(err.response?.data ? err.response.data.message : 'Something went wrong.')
        throw err;
      });
  }

  return [data, isLoading, errorMessage, next, cancel];
}

export default useFetchData;