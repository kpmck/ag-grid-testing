import {sort} from "../agGrid/sort.enum";

export function getKeyByValue(object, value) {
    return Object.keys(object).find(key => object[key] === value);
}

/**
 * Deletes a key/value from the given collection
 * @param obj The collection
 * @param key The key to delete
 */
export function deleteKey(obj, key) {
    delete obj[key];
}

/**
 * Renames the key in a collection and removed the old key.
 * @param obj The collection
 * @param oldKey Old key value
 * @param newKey New key value
 */
export function renameKey(obj, oldKey, newKey) {
    obj[newKey] = obj[oldKey];
    delete obj[oldKey];
}

/**
 *
 * @param field field to sort on
 * @param reverse true will return results in ascending order, false will return results in descending order
 * @param primer
 */
const sort_by = (field, reverse, primer) => {

    const key = primer ?
        function (x) {
            return primer(x[field]);
        } :
        function (x) {
            return x[field];
        };

    reverse = !reverse ? 1 : -1;

    return function (a, b) {
        return a = key(a), b = key(b), reverse * ((a > b) - (b > a));
    };
};

/**
 * This will return the collection of data in the specified sorted order. The pageSize indicates the number of
 * records to be returned.
 * @param collection The returned expected table data from getExpectedTableData() function
 * @param columnName The name of the column to sort
 * @param sortedBy sort.ascending or sort.descending
 * @param pageSize (Optional) declare the max number of items on each grid page. Default is 15.
 */
export function sortedCollectionByProperty(collection, columnName, sortedBy, pageSize = 15) {
    let isDescending = false;
    switch (sortedBy) {
        case sort.descending:
            isDescending = true;
            break;
    }
    return collection.sort(sort_by(columnName, isDescending, (a) => a.toUpperCase())).slice(0, pageSize)
}
