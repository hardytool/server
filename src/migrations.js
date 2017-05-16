function migrateIfNeeded(db, migrations) {
  // 2 - check if the migrations table exists
  // 3 - get latest migration from table if exists
  // 4 - get latest migration from list of migrations
  migrations.forEach(function(migration) {
    console.log(migration.contents)
    db.query(migration.contents, function(err) {
      if(err) {
        return console.error('migration failed:', err)
      }

      console.log('migration complete:', migration.name)
    })
  })
}

// Default implementation
// directory should be path.join(__dirname, 'migrations')
function getMigrations(fs, path, directory) {
  var results = []
  fs.readdirSync(directory).forEach(function(file) {
    var stat = fs.statSync(file)

    if (stat && stat.isDirectory()) {
        results = results.concat(getMigrations(path.join(directory, file)))
    } else {
      results.push({
        name: file,
        contents: fs.readFileSync(file, 'utf8')
      })
    }
  })
  return results
}

module.exports = {
  getMigrations: getMigrations,
  migrateIfNeeded: migrateIfNeeded
}
