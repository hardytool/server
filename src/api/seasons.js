function list(season, _req, res) {
  season.getSeasons().then(seasons => {
    res.json(seasons)
  }).catch(err => {
    console.error(err)
    res.sendStatus(500)
  })
}

function view(season, req, res) {
  const id = req.params.id
  season.getSeason(id).then(season => {
    res.json(season)
  }).catch(err => {
    console.error(err)
    res.sendStatus(500)
  })
}

module.exports = (season) => {
  return {
    list: {
      route: '/api/v1/seasons',
      handler: list.bind(null, season)
    },
    view: {
      route: '/api/v1/seasons/:id',
      handler: view.bind(null, season)
    }
  }
}