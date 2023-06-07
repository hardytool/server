function list(division, _req, res) {
  division.getDivisions({active: true}).then(divisions => {
    res.json(divisions)
  }).catch(err => {
    console.error(err)
    res.sendStatus(500)
  })
}

function view(division, req, res) {
  const division_id = req.params.division_id
  division.getDivision(division_id).then(division => {
    return admin.getDivisionAdmins(division_id).then(divisionAdmins => {
      res.json({
        ...division,
        divisionAdmins: divisionAdmins
      })
    })
  }).catch(err => {
    console.error(err)
    res.sendStatus(500)
  })
}

module.exports = (division) => {
  return {
    list: {
      route: '/api/v1/divisions',
      handler: list.bind(null, division)
    },
    view: {
      route: '/api/v1/divisions/:division_id',
      handler: view.bind(null, division)
    }
  }
}