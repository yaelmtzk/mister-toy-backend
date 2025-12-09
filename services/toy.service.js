
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
let toys = utilService.readJsonFile('data/toy.json')

const gLabels = ['On wheels', 'Box game', 'Art', 'Baby', 'Doll',
    'Puzzle', 'Outdoor', 'Battery Powered']

function query(filterBy = {}) {
    let filteredToys = [...toys]
    
    let { txt, maxPrice, labels, sortBy, stock } = filterBy
    
    if (txt) {
        const regex = new RegExp(txt, 'i')
        filteredToys = filteredToys.filter((toy) => regex.test(toy.name))
    }

    if (maxPrice) filteredToys = filteredToys.filter((toy) => toy.price <= maxPrice)

    if (labels) {
        const labelToFilter = labels
        filteredToys = filteredToys.filter((toy) =>
            toy.labels.some((label) =>
                label.includes(labelToFilter))
        )
    }

    if (sortBy) {
        if (sortBy === 'txt') filteredToys = filteredToys.sort((a, b) => a.name.localeCompare(b.name))

        else if (sortBy === 'price') filteredToys = filteredToys.sort((a, b) => a.price - b.price)

        else if (sortBy === 'created') filteredToys = filteredToys.sort((a, b) => a.createdAt - b.createdAt)

        // if (sortDir === -1) filteredToys.reverse()
    }

    if (stock) {
        if (stock === 'true') filteredToys = filteredToys.filter((toy) => toy.inStock === true)
        if (stock === 'false') filteredToys = filteredToys.filter((toy) => toy.inStock === false)
    }

    // if (filterBy.pageIdx !== undefined) {
    //     const startIdx = filterBy.pageIdx * PAGE_SIZE
    //     filteredToys = filteredToys.slice(startIdx, startIdx + PAGE_SIZE)
    // }

    return Promise.resolve(filteredToys)
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
        toy.creator._id !== loggedinUser._id) {
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
        toy.creator = loggedinUser
        toy.imgUrl = 'hardcoded-url-for-now'
        toy.inStock = true
        toy.createdAt = Date.now()
        toy.labels = _getRandLabels(toy.name, gLabels)
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

function _getRandLabels(name, labels) {
  const res = new Set()
  const match = labels.find(lbl =>
    lbl.toLowerCase().includes(name.toLowerCase())
  )
  if (match) res.add(match)

  while (res.size < 3) {
    const randomLabel = labels[utilService.getRandomIntInclusive(0, labels.length - 1)]
    res.add(randomLabel)
  }
  return [...res]
}