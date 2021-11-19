import xhr from 'xhr';

export const customApi = (methodType, uri) => new Promise((resolve, reject) => {
    const api = `/mock/${uri}`;
    // const api = `${window.BASE_API_URL}/${uri}`;
    const token = window.getUserToken();
    xhr(
        {
            method: methodType,
            uri: api,
            json: true,
            headers: {token}
        },
        (error, response) => {
            if (error || response.statusCode !== 200) {
                return reject(new Error(response.status));
            }
            return resolve(response.body);
        }
    );
});
