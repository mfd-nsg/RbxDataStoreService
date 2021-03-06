import Http, { AxiosRequestConfig, AxiosResponse } from 'axios';
import { DataStore } from './DataStore';
import { Globals } from '../Util/Globals';
import { RequestType, DataStoreService } from './Services/DataStoreService';
import { Agent } from 'https';
import { FASTFLAG, FFlag } from '../Tools/FastLogTool';

FASTFLAG('Debug');

export class HttpRequest {
	public key: string;
	public url: string;
	public postData: string;
	public owner: DataStore;
	public method: string;
	public additionalHeaders: Record<string, string> = {};

	public doNotParse: boolean = false;

	public async execute(_dataStoreService: DataStoreService): Promise<AxiosResponse<any>> {
		return new Promise((resumeFunction, errorFunction) => {
			const http = <AxiosRequestConfig>{
				headers: {
					...Globals.GlobalHeaders(),
					...this.additionalHeaders,
				},
				transformResponse: (resp, headers) => {
					if (this.doNotParse) return resp;

					if (headers && headers['content-type'] && headers['content-type'].includes('json'))
						try {
							return JSON.parse(resp);
						} catch {
							return resp; // TODO Report an error here.
						}
					return resp;
				},
				httpsAgent: new Agent({ rejectUnauthorized: !FFlag['Debug'] }),
			};
			if (!this.method)
				Http.post(
					this.url,
					this.postData === undefined || this.postData.length === 0 ? ' ' : this.postData,
					<AxiosRequestConfig>http,
				)
					.then((res) => {
						resumeFunction(res);
					})
					.catch((e) => {
						errorFunction(e);
					});
			else if (this.method === 'GET')
				Http.get(this.url, <AxiosRequestConfig>http)
					.then((res) => {
						resumeFunction(res);
					})
					.catch((e) => {
						errorFunction(e);
					});
			else if (this.method === 'DELETE')
				Http.delete(this.url, <AxiosRequestConfig>http)
					.then((res) => {
						resumeFunction(res);
					})
					.catch((e) => {
						errorFunction(e);
					});
		});
	}

	public requestType: RequestType;
}
