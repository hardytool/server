var fs = require('fs')
var path = require('path')
var sql = require('pg-sql').sql
var Promise = require('bluebird')

function migrateIfNeeded(db, migrations) {
  // 2 - check if the migrations table exists
  // 3 - get latest migration from table if exists
  // 4 - get latest migration from list of migrations
  migrations.sort((a, b) => {
    if (a.name < b.name) {
      return -1
    }
    if (a.name > b.name) {
      return 1
    }
    return 0
  })

  return Promise.mapSeries(migrations, migration => {
    return db.query('SELECT version FROM migration').catch(() => {
      console.log('MIGRATION TABLE DOES NOT EXIST')
    }).then(result => {
      var versions = result
        ? result.rows.map(row => { return row.version })
        : []
      var contained = versions.indexOf(migration.name) > -1

      if (!contained) {
        console.log(`RUNNING MIGRATION ${migration.name}`)
        return db.query(migration.contents).then(() => {
          console.log('UPDATING MIGRATION VERSION')
          var insert = sql`
            INSERT INTO migration (
              version,
              migrated
            )
            VALUES (
              ${migration.name},
              ${new Date().toUTCString()}::timestamp with time zone
            )
            RETURNING version;`
          return db.query(insert)
        }).then(result => {
          console.log(`VERSION: ${result.rows[0].version}`)
          return Promise.resolve(result.rows[0].version)
        })
      } else {
        console.log('MIGRATION ALREADY RUN')
        return Promise.resolve(false)
      }
    })
  })
}

// Default implementation
// directory should be path.join(__dirname, 'migrations')
function getMigrations(directory) {
  var results = []
  fs.readdirSync(directory).forEach(file => {
    var f = path.join(directory, file)
    var stat = fs.statSync(f)

    if (stat && stat.isDirectory()) {
        results = results.concat(getMigrations(f))
    } else {
      results.push({
        name: path.basename(file, path.extname(file)),
        contents: fs.readFileSync(f, 'utf8')
      })
    }
  })
  return results
}

module.exports = db => {
  return {
    getMigrations: getMigrations,
    migrateIfNeeded: migrateIfNeeded.bind(null, db)
  }
}
