import { ObjectId } from 'mongodb'

import { dbService } from '../../services/db.service.js'
import { loggerService } from '../../services/logger.service.js'
import { utilService } from '../../services/util.service.js'
import { log } from '../../middlewares/logger.middleware.js'

export const toyService = {
	query,
	getById,
	add,
	update,
	remove,
	addtoyMsg,
	removetoyMsg,
}

async function query(filterBy = { txt: '' }) {
	
	try {
		const criteria = {}

		if (filterBy.txt) {
			criteria.name = { $regex: filterBy.txt, $options: 'i' }
		}

		if (filterBy.maxPrice) {
			criteria.price = { $lte: +filterBy.maxPrice }
		}

		if (filterBy.labels?.length) {
			criteria.labels = { $in: filterBy.labels }
		}

		if (filterBy.stock !== '') {
			criteria.inStock = filterBy.stock === 'true'
		}

		if (filterBy.user) {
			criteria['creator._id'] = filterBy.user
		}

		const sort = {}

		if (filterBy.sortBy === 'price') sort.price = 1
		if (filterBy.sortBy === 'created') sort.createdAt = -1
		if (filterBy.sortBy === 'txt') sort.name = 1

		const collection = await dbService.getCollection('toy')
		var toys = await collection.find(criteria).sort(sort).toArray()	

		return toys

	} catch (err) {
		loggerService.error('cannot find toys', err)
		throw err
	}
}

async function getById(toyId) {
	try {
		const collection = await dbService.getCollection('toy')
		const toy = await collection.findOne({ _id: ObjectId.createFromHexString(toyId) })
		toy.createdAt = toy._id.getTimestamp()
		return toy
	} catch (err) {
		loggerService.error(`while finding toy ${toyId}`, err)
		throw err
	}
}

async function remove(toyId) {
	try {
		const collection = await dbService.getCollection('toy')
		const { deletedCount } = await collection.deleteOne({ _id: ObjectId.createFromHexString(toyId) })
		return deletedCount
	} catch (err) {
		loggerService.error(`cannot remove toy ${toyId}`, err)
		throw err
	}
}

async function add(toy) {
	try {
		const collection = await dbService.getCollection('toy')
		await collection.insertOne(toy)
		return toy
	} catch (err) {
		loggerService.error('cannot insert toy', err)
		throw err
	}
}

async function update(toy) {
	try {
		const toyToSave = {
			name: toy.name,
			price: toy.price,
		}
		const collection = await dbService.getCollection('toy')
		await collection.updateOne({ _id: ObjectId.createFromHexString(toy._id) }, { $set: toyToSave })
		return toy
	} catch (err) {
		loggerService.error(`cannot update toy ${toy._id}`, err)
		throw err
	}
}

async function addtoyMsg(toyId, msg) {
	try {
		msg.id = utilService.makeId()

		const collection = await dbService.getCollection('toy')
		await collection.updateOne({ _id: ObjectId.createFromHexString(toyId) }, { $push: { msgs: msg } })
		return msg
	} catch (err) {
		loggerService.error(`cannot add toy msg ${toyId}`, err)
		throw err
	}
}

async function removetoyMsg(toyId, msgId) {
	try {
		const collection = await dbService.getCollection('toy')
		await collection.updateOne({ _id: ObjectId.createFromHexString(toyId) }, { $pull: { msgs: { id: msgId } } })
		return msgId
	} catch (err) {
		loggerService.error(`cannot add toy msg ${toyId}`, err)
		throw err
	}
}