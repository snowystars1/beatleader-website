import { writable } from 'svelte/store'
import { BL_API_URL } from '../../network/queues/beatleader/api-queue'
import process from '../../network/clients/beatleader/scores/utils/process';
import { typesMap } from '../../utils/beatleader/format'

let store = null;
let storeSubCount = 0;

export default () => {
    storeSubCount++;
    if (store) return store;

    let votingStatuses = {};

    const get = () => votingStatuses;
    const { subscribe: subscribeState, set } = writable(votingStatuses);

    const fetchStatus = async (hash, diff, mode) => {
        if (!hash || !diff || !mode) return;
        fetch(BL_API_URL + `votestatus/${hash}/${diff}/${mode}`, { credentials: 'include' })
            .then(response => response.text())
            .then(data => {
                votingStatuses[hash + diff + mode] = parseInt(data);
                set(votingStatuses);
            })
    }

    const vote = async (hash, diff, mode, rankability, stars, types) => {
        if (!hash || !diff || !mode) return;
        let type = 0;
        types.forEach(typeName => {
            type += typesMap[typeName];
        });

        fetch(BL_API_URL + `vote/${hash}/${diff}/${mode}?rankability=${rankability ? 1 : 0}` + (stars ? "&stars=" + stars : "") + (type ? "&type=" + type : ""),
            { credentials: 'include', method: 'POST' })
            .then(response => response.text())
            .then(data => {
                votingStatuses[hash + diff + mode] = parseInt(data);
                set(votingStatuses);
            })
    }

    const qualifyMap = async (hash, diff, mode, rankability, stars, types, allowedByMapper) => {
        if (!hash || !diff || !mode) return;
        let type = 0;
        types.forEach(typeName => {
            type += typesMap[typeName];
        });

        votingStatuses.loading = true;
        set(votingStatuses);

        fetch(BL_API_URL + `qualify/${hash}/${diff}/${mode}?rankability=${rankability ? 1 : 0}` 
            + (stars ? "&stars=" + stars : "") 
            + (type ? "&type=" + type : "")
            + (allowedByMapper ? "&allowed=true" : ""),
            { credentials: 'include', method: 'POST' }).then(() => {
                votingStatuses.loading = false;
                set(votingStatuses);
                document.location.reload()
            })
    }

    const voteFeedback = async (scoreId, value, completion) => {
        fetch(BL_API_URL + `votefeedback?scoreId=${scoreId}&value=${value}`,
            { credentials: 'include', method: 'POST' }).then(() => {
                completion();
            })
    }

    const updateMap = async (hash, diff, mode, rankability, stars, types) => {
        if (!hash || !diff || !mode) return;
        let type = 0;
        types.forEach(typeName => {
            type += typesMap[typeName];
        });

        votingStatuses.loading = true;
        set(votingStatuses);

        fetch(BL_API_URL + `rank/${hash}/${diff}/${mode}?rankability=${rankability ? 1 : 0}` + (stars ? "&stars=" + stars : "") + (type ? "&type=" + type : ""),
            { credentials: 'include', method: 'POST' }).then(() => {
                votingStatuses.loading = false;
                set(votingStatuses);
                document.location.reload()
            })
    }

    const fetchResults = async (id) => {
        if (!id) return;
        fetch(BL_API_URL + `leaderboard/ranking/${id}`, { credentials: 'include' })
            .then(response => response.json())
            .then(data => {
                votingStatuses[id] = data;
                set(votingStatuses);
            })
    }

    const subscribe = fn => {
        const stateUnsubscribe = subscribeState(fn);

        return () => {
            storeSubCount--;

            if (storeSubCount === 0) {
                store = null;

                stateUnsubscribe();
            }
        }
    }

    return {
        subscribe,
        get,
        fetchStatus,
        vote,
        fetchResults,
        updateMap,
        qualifyMap,
        voteFeedback
    }
}
