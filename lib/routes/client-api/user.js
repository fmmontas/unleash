'use strict';

const { Router } = require('express');
const extractUser = require('../../extract-user');
const { FEATURE_UPDATED } = require('../../event-type');
const NameExistsError = require('../../error/name-exists-error');
const NotFoundError = require('../../error/notfound-error');
const ValidationError = require('../../error/validation-error.js');
const { union, without } = require('lodash');
const logger = require('../../logger')('/admin-api/user.js');

const version = 1;
const defaultStratergyName = 'default';
const userWithIdStratergyName = 'userWithId';
const gradualRolloutUserIdStratergyName = 'gradualRolloutUserId';

const handleErrors = (req, res, error) => {
    logger.warn('Error creating or updating feature', error);
    switch (error.constructor) {
        case NotFoundError:
            return res.status(404).end();
        case NameExistsError:
            return res
                .status(403)
                .json([
                    {
                        msg:
                            'A feature with this name already exists. Try re-activating it from the archive.',
                    },
                ])
                .end();
        case ValidationError:
            return res
                .status(400)
                .json(req.validationErrors())
                .end();
        default:
            logger.error('Server failed executing request', error);
            return res.status(500).end();
    }
};

exports.router = config => {
    const router = Router();
    const { featureToggleStore, eventStore } = config.stores;

    const featuresByUserFilter = (features, userId) =>
        features.map(feature => {
            const enabled = feature.strategies.some(stratergy => {
                // TODO: Need some null checks but 48hours.

                switch (stratergy.name) {
                    case defaultStratergyName:
                        return feature.enabled;
                    case gradualRolloutUserIdStratergyName:
                        return false; // TODO: Need to check with client on implementation for hash on gradual.
                    case userWithIdStratergyName:
                        return (
                            feature.enabled &&
                            stratergy.parameters.userIds
                                .split(',')
                                .includes(userId)
                        );
                    default:
                        return false;
                }
            });

            return {
                name: feature.name,
                description: feature.description,
                enabled,
                devOnly: feature.devOnly,
                togglable: feature.strategies.some(
                    stratergy => stratergy.name === userWithIdStratergyName
                ),
            };
        });

    router.get('/:userId/features', (req, res) => {
        featureToggleStore.getFeatures().then(features =>
            res.json({
                version,
                features: featuresByUserFilter(features, req.params.userId),
            })
        );
    });

    router.post('/:userId/features/:featureName/toggle', (req, res) => {
        const featureName = req.params.featureName;
        const userName = extractUser(req);

        featureToggleStore
            .getFeature(featureName)
            .then(feature => {
                const userByIdStratergy = feature.strategies.find(
                    stratergy => stratergy.name === userWithIdStratergyName
                );

                if (!userByIdStratergy || feature.devOnly)
                    return Promise.reject(
                        new ValidationError('Cannot toggle feature for user.')
                    );

                const userId = req.params.userId;
                const currentUserIds = userByIdStratergy.parameters.userIds.split(
                    ','
                );

                userByIdStratergy.parameters.userIds = currentUserIds.includes(
                    userId
                )
                    ? without(currentUserIds, userId).join(',')
                    : union(currentUserIds, [userId]).join(','); // TODO: This might technically be a but when array is single element.

                return eventStore.store({
                    type: FEATURE_UPDATED,
                    createdBy: userName,
                    data: feature,
                });
            })
            .then(() => res.json({}))
            .catch(error => handleErrors(req, res, error));
    });

    return router;
};
