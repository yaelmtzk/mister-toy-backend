
import fs from 'fs'
import { utilService } from './util.service.js'
import { loggerService } from './logger.service.js'

export const toyService = {
    query,
    getById,
    remove,
    save
}

const PAGE_SIZE = 3
const toys = utilService.readJsonFile('data/toy.json')

function query(filterBy = {}) {
    let { txt, maxPrice, labels, sortBy, stock } = filterBy

    if (txt) {
        const regex = new RegExp(txt, 'i')
        toys = toys.filter((toy) => regex.test(toy.name))
    }

    if (maxPrice) toys = toys.filter((toy) => toy.price <= maxPrice)

    if (labels) {
        const labelToFilter = labels
        toys = toys.filter((toy) =>
            toy.labels.some((label) =>
                label.includes(labelToFilter))
        )
    }

    if (sortBy) {
        if (sortBy === 'txt') toys = toys.sort((a, b) => a.name.localeCompare(b.name))

        else if (sortBy === 'price') toys = toys.sort((a, b) => a.price - b.price)

        else if (sortBy === 'created') toys = toys.sort((a, b) => a.createdAt - b.createdAt)

        // if (sortDir === -1) filtered.reverse()
    }

    if (stock) {
        if (stock === 'true') toys = toys.filter((toy) => toy.inStock === true)
        if (stock === 'false') toys = toys.filter((toy) => toy.inStock === false)
    }

    if (filterBy.pageIdx !== undefined) {
        const startIdx = filterBy.pageIdx * PAGE_SIZE
        toysToReturn = toysToReturn.slice(startIdx, startIdx + PAGE_SIZE)
    }

    return Promise.resolve(toys)
}

function getById(toyId) {
    const toy = toys.find(toy => toy._id === toyId)
    return Promise.resolve(toy)
}

function remove(toyId, loggedinUser) {
    const idx = toys.findIndex(toy => toy._id === toyId)
    if (idx === -1) return Promise.reject('No Such toy')

    const toy = toys[idx]
    if (!loggedinUser.isAdmin &&
        toy.owner._id !== loggedinUser._id) {
        return Promise.reject('Not your toy')
    }
    toys.splice(idx, 1)
    return _saveToysToFile()
}

function save(toy, loggedinUser) {
    if (toy._id) {
        const toyToUpdate = toys.find(currtoy => currtoy._id === toy._id)
        if (!loggedinUser.isAdmin &&
            toyToUpdate.creator._id !== loggedinUser._id) {
            return Promise.reject('Not your toy')
        }
        toyToUpdate.name = toy.name
        toyToUpdate.price = toy.price
        toy = toyToUpdate
    } else {
        toy._id = utilService.makeId()
        // toy.creator = loggedinUser
        const labels = ['On wheels', 'Box game', 'Art', 'Baby', 'Doll',
            'Puzzle', 'Outdoor', 'Battery Powered']
        toy.labels = _getRandLabels(toy.name, labels)
        toys.push(toy)
    }
    // delete toy.creator.credits
    return _saveToysToFile().then(() => toy)
}


function _saveToysToFile() {
    return new Promise((resolve, reject) => {
        const data = JSON.stringify(toys, null, 2)
        fs.writeFile('data/toy.json', data, (err) => {
            if (err) {
                loggerService.error('Cannot write to toys file', err)
                return reject(err)
            }
            resolve()
        })
    })
}