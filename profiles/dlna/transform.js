var fs = require('fs'),
    util = require('util');
var input = JSON.parse(fs.readFileSync(process.argv[2]));
var output = {};

if (('restrictions' in input)) {
    output.restrictions = {};
    if (!util.isArray(input.restrictions.restriction)) {
        input.restrictions.restriction = [input.restrictions.restriction];
    }
    input.restrictions.restriction.map(function(restriction) {
        if (('id' in restriction) && !(restriction.id in output.restrictions)) {
            output.restrictions[restriction.id] = {};
        }
        if (('parent' in restriction) && !util.isArray(restriction.parent)) {
            restriction.parent = [restriction.parent];
        }
        if (('field' in restriction) && !util.isArray(restriction.field)) {
            restriction.field = [restriction.field];
        }
        var copy = clone(restriction);
        delete copy.id;
        delete copy.type;
        delete copy.field;
        copy.parent = [];
        if ('parent' in restriction) {
            restriction.parent.map(function(r) {
                if (r !== undefined) {
                    copy.parent.push(r.name);
                }
            });
        } else {
            delete copy.parent;
        }
        if (('field' in restriction)) {
            restriction.field.map(function(field) {
                copy[field.name] = ('range' in field) ? field.range : field.value;
            });
        }
        output.restrictions[restriction.id][restriction.type] = copy;
    });
}

if (('dlna-profile' in input)) {
    if (!util.isArray(input['dlna-profile'])) {
        input['dlna-profile'] = [input['dlna-profile']];
    }
    output.profiles = {};

    input['dlna-profile'].map(function(profile) {
        var copy = clone(profile);
        if (('id' in profile) && !(profile.id in output.profiles)) {
            output.profiles[profile.id] = {};
        }
        if (('parent' in profile) && !util.isArray(profile.parent)) {
            profile.parent = [profile.parent];
        }
        if (('field' in profile) && !util.isArray(profile.field)) {
            profile.field = [profile.field];
        }
        if (('restriction' in profile) && !util.isArray(profile.restriction)) {
            profile.restriction = [profile.restriction];
        }
        delete copy.id;
        delete copy.name;
        delete copy.type;
        delete copy.field;

        copy.parent = [];
        if ('parent' in profile) {
            profile.parent.map(function(r) {
                if (r !== undefined) {
                    copy.parent.push(r.name);
                }
            });
        } else {
            delete copy.parent;
        }

        if (('field' in profile)) {
            profile.field.map(function(field) {
                copy[field.name] = ('range' in field) ? field.range : field.value;
            });
        }
        if (('restriction' in profile)) {
            copy.restriction = {};
            profile.restriction.map(function(restriction) {
                if (('type' in restriction) && !(restriction.type in copy.restriction)) {
                    copy.restriction[restriction.type] = [];
                }
                if (('parent' in restriction) && !util.isArray(restriction.parent)) {
                    restriction.parent = [restriction.parent];
                }
                if (('field' in restriction) && !util.isArray(restriction.field)) {
                    restriction.field = [restriction.field];
                }
                var copy2 = clone(restriction);
                delete copy2.id;
                delete copy2.type;
                delete copy2.field;
                copy2.parent = [];
                if ('parent' in restriction) {
                    restriction.parent.map(function(r) {
                        if (r !== undefined) {
                            copy2.parent.push(r.name);
                        }
                    });
                } else {
                    delete copy2.parent;
                }
                if (('field' in restriction)) {
                    restriction.field.map(function(field) {
                        copy2[field.name] = ('range' in field) ? field.range : field.value;
                    });
                }
                copy.restriction[restriction.type].push(copy2);
            });
        }

        output.profiles[('id' in profile) ? profile.id : profile.name] = copy;
    });
}

function clone(input) {
    return JSON.parse(JSON.stringify(input));
}

//console.log(input['dlna-profile']);

//process.exit();
console.log(JSON.stringify(output, null, "  "));